// ── Child Avatar ──
// The child's profile picture: one of six curated buddies in a soft tinted
// circle. Profiles made before the curated set stored an emoji; those map
// to the closest buddy (or a stable fallback), so nobody sees an emoji.

import { CritterSprite, SpeciesKey } from './CritterSprite';
import { AvatarId, CHILD_AVATARS } from './characters.config';

const LEGACY_EMOJI: Record<string, AvatarId> = {
  '🦊': 'fox', '🦄': 'unicorn', rabbit: 'unicorn', '🐰': 'unicorn', '🦉': 'owl', '🐢': 'turtle', '🐼': 'panda', koala: 'panda', '🐉': 'dragon', '🐲': 'dragon',
};

export function resolveAvatar(stored: string) {
  const id = CHILD_AVATARS.some(a => a.id === stored) ? stored : LEGACY_EMOJI[stored];
  const found = CHILD_AVATARS.find(a => a.id === id);
  if (found) return found;
  // Any other old emoji: pick a buddy from it, the same one every time.
  const hash = [...stored].reduce((h, ch) => h + (ch.codePointAt(0) ?? 0), 0);
  return CHILD_AVATARS[hash % CHILD_AVATARS.length];
}

export default function ChildAvatar({ avatar, size = 48 }: { avatar: string; size?: number }) {
  const a = resolveAvatar(avatar);
  return (
    <span aria-hidden="true" className="relative block rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, background: a.tint }}>
      {a.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.image} alt="" className="absolute max-w-none"
          style={a.crop ? {
            // Zoom the full-body picture to a head-and-shoulders crop
            width: a.crop[3] * size / a.crop[2],
            left: size / 2 - a.crop[0] * size / a.crop[2],
            top: size / 2 - a.crop[1] * size / a.crop[2],
          } : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        // A bust: the critter sits low in the circle so its face is centered
        <CritterSprite species={a.id as SpeciesKey} size={size} animate={false}
          style={{ position: 'absolute', left: 0, top: size * 0.14 }} />
      )}
    </span>
  );
}
