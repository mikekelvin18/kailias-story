'use client';

import { CritterSprite, type SpeciesKey } from '@/components/characters/CritterSprite';

// ── The story's friend, standing in the scene ──
// Kelvin (2026-11-23): "it says the deer are safe to cross, but it's only
// Noel". Whoever a round's little story is about must really be on screen.
// Every story deck entry names its `who`; the game puts <StoryGuest> on the
// same ground as Kailia (x, y = % of the scene, at the feet). It hops when
// the round is won. A family or a group gets a little one beside it.

/** Animals that can star in a story. Fox, owl, turtle and dragon are the
 *  child's buddies (their own pictures), so stories only use them where the
 *  game's world is theirs (Dragon Bridge, the owl's Moonlight Match). */
export type StoryWho = SpeciesKey;

const GROUPS = new Set<StoryWho>(['deer', 'bee', 'butterfly', 'parrot']);

export default function StoryGuest({ who, x, y, size = 54, cheer = false, group, z = 4, glow = 1, flip = false }: {
  who: StoryWho | null | undefined;
  x: number; y: number; size?: number;
  /** the round was won: a happy hop */
  cheer?: boolean;
  /** show a little one beside it (defaults on for deer, bees, butterflies, parrots) */
  group?: boolean;
  z?: number;
  /** 0–1: how lit the guest is (night scenes brighten it as they glow) */
  glow?: number;
  flip?: boolean;
}) {
  if (!who) return null;
  const many = group ?? GROUPS.has(who);
  return (
    <div data-story-friend={who} className="absolute pointer-events-none" style={{
      left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)', zIndex: z,
      filter: glow < 1 ? `brightness(${0.75 + glow * 0.25})` : undefined, transition: 'filter 0.6s',
    }}>
      <span key={cheer ? 'cheer' : 'idle'} className={`relative inline-block ${cheer ? 'kp-hop' : 'drop-in'}`} style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
        <CritterSprite species={who} size={size} />
        {many && (
          <span className="absolute" style={{ left: -size * 0.5, bottom: 0 }}>
            <CritterSprite species={who} size={Math.round(size * 0.7)} />
          </span>
        )}
      </span>
    </div>
  );
}
