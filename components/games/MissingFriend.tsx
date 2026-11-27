'use client';

// "Who is missing?" lineup for the wild-friend memory riddle (Kailia's Trail
// and Kailia's Journey). Muse round 7: the old "Still here:" row only listed
// who stayed, squeezed together, so the riddle could only be guessed. Now
// everyone keeps their spot and the one who slipped away leaves an empty
// spot with a "?" (so you can tell WHERE someone went missing). It stays a
// memory riddle first; after one slip (`shadow`) the spot fills with a dark
// shadow of the missing friend's shape, so the answer can be checked on
// screen instead of guessed.

import { Critter } from '@/components/characters/CritterSprite';

export default function MissingFriend({ full, gap, size = 44, tone = 'light', shadow = false }:
  { full: string[]; gap: number; size?: number; tone?: 'light' | 'dark'; shadow?: boolean }) {
  return (
    <div data-missing-lineup className="flex gap-2 justify-center flex-wrap my-1">
      {full.map((c, i) => i === gap ? (
        <span key={i} data-missing-gap className="relative inline-flex items-end justify-center rounded-2xl"
          style={{ width: size + 10, height: size + 10, border: `2.5px dashed ${tone === 'light' ? '#64748B' : '#CBD5E1'}`, background: tone === 'light' ? '#F1F5F9' : 'rgba(255,255,255,0.12)' }}>
          {/* its shadow: the same picture, filled dark */}
          {shadow && (
            <span data-missing-shadow aria-hidden="true" className="bounce-in" style={{ filter: 'brightness(0)', opacity: 0.38 }}>
              <Critter emoji={c} size={size} animate={false} />
            </span>
          )}
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold"
            style={{ color: '#FFFFFF', textShadow: '0 0 4px #1E293B, 0 2px 0 #1E293B' }}>?</span>
          <span className="sr-only">an empty spot: someone was here</span>
        </span>
      ) : (
        <span key={i} className="inline-flex items-end justify-center" style={{ width: size + 10, height: size + 10 }}>
          <Critter emoji={c} size={size} />
        </span>
      ))}
    </div>
  );
}
