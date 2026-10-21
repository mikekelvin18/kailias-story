'use client';

// ── Friends' adventures: pick a friend ──
// Six companions, each with its own trail for one skill
// (lib/companionTrails.ts). Opens after all six lands are finished.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LiveArt from '@/components/characters/LiveArt';
import PandaSprite from '@/components/characters/PandaSprite';
import BackButton from '@/components/ui/BackButton';
import { TRAILS, TRAIL_LENGTH, companionFor, trailId, petWidth } from '@/lib/companionTrails';
import { loadProgress, isBonusLandUnlocked } from '@/lib/adventure';
import { loadRewards, getFocusCompanion } from '@/lib/rewards';

export default function FriendsPage() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [reached, setReached] = useState<Record<string, number>>({});

  useEffect(() => {
    setOpen(isBonusLandUnlocked(loadProgress()));
    setFocus(getFocusCompanion());
    setReached(loadRewards().gameLevels);
    setReady(true);
  }, []);

  const focusTrail = TRAILS.find(t => t.pet === focus);
  const noelLine = !open
    ? 'Your friends are still getting their adventures ready. Finish all six lands and they’ll take you along!'
    : focusTrail
      ? `${focusTrail.pet} looks ready for an adventure today!`
      : 'Pick a friend. Each one has their very own adventure!';

  return (
    <div className="min-h-screen px-4 pt-5 pb-10" style={{ background: '#EEF5FF' }}>
      <div className="max-w-xl mx-auto">
        <BackButton href="/play" label="Map" />
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: '#1F2A44' }}>
          Who do you want to play with?
        </h1>
        <p className="mt-1 text-base font-bold" style={{ color: '#4A5578' }}>Each friend has their own adventure.</p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {TRAILS.map(t => {
            const c = companionFor(t);
            const steps = Math.min(TRAIL_LENGTH, reached[trailId(t)] ?? 0);
            const card = (
              <>
                <span className="flex items-end justify-center w-full h-36 rounded-2xl"
                  style={{ background: `${t.color}55` }}>
                  <LiveArt src={c.art} alt={`${t.pet} the ${c.kind}`} size={petWidth(c.art, 112)} kind="pet" pokeable={false}
                    style={{ marginBottom: 10 }} />
                </span>
                <span className="mt-2 text-xl font-extrabold leading-none" style={{ color: '#1F2A44' }}>{t.pet}</span>
                <span className="mt-1 text-sm font-bold leading-tight" style={{ color: '#4A5578' }}>{t.skillLabel}</span>
                {/* how far along: a thin line, no numbers or scores */}
                <span className="mt-2 w-3/4 h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }} aria-hidden="true">
                  <span className="block h-full rounded-full" style={{ width: `${(steps / TRAIL_LENGTH) * 100}%`, background: t.sky }} />
                </span>
              </>
            );
            const cls = 'relative flex flex-col items-center p-2.5 pb-3 rounded-3xl bg-white text-center transition-transform';
            const style = { boxShadow: `0 4px 0 ${t.color}, 0 6px 14px rgba(31,42,68,0.10)`,
              outline: focus === t.pet ? `3px solid ${t.sky}` : undefined };
            return open && ready ? (
              <Link key={t.slug} href={`/play/friends/${t.slug}`} className={`${cls} hover:scale-[1.03] active:scale-[0.98]`} style={style}>
                {card}
              </Link>
            ) : (
              <div key={t.slug} className={cls} style={{ ...style, opacity: 0.7 }} aria-disabled="true">{card}</div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-3">
          <PandaSprite size={52} expression={open ? 'excited' : 'thinking'} style={{ flexShrink: 0 }} />
          <p className="text-[15px] font-bold leading-snug" style={{ color: '#1F2A44' }}>{noelLine}</p>
        </div>
      </div>
    </div>
  );
}
