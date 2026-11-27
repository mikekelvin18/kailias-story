'use client';

// Starlight total + the last few games finished, for the grown-ups'
// reports (/results and /progress). Muse retest #3: the parent report
// should show gameplay, not only the placement. Read from this device only.

import { useEffect, useState } from 'react';
import { loadRewards, explorerLevel } from '@/lib/rewards';
import { recentPlays, type RecentPlay } from '@/lib/gameSummary';
import { DOMAIN_META } from '@/lib/activities';

export default function PlayLog({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const [light, setLight] = useState<number | null>(null);
  const [plays, setPlays] = useState<RecentPlay[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device
    setLight(loadRewards().starlight);
    setPlays(recentPlays(10));
  }, []);
  if (light == null) return null;
  const dark = tone === 'dark';
  const muted = dark ? 'text-slate-300' : 'text-slate-500';
  const strong = dark ? 'text-white' : 'text-slate-700';
  const when = (ts: number) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <div className="mb-4">
      <p className={`text-sm ${strong}`}>
        <span className="font-extrabold">✨ {light} starlight</span>
        <span className={muted}> · Explorer level {explorerLevel(light)}</span>
      </p>
      {plays.length > 0 && (
        <details className="mt-2">
          <summary className={`text-sm font-bold cursor-pointer ${dark ? 'text-purple-200' : 'text-violet-600'}`}>
            Recent play ({plays.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {plays.map((p, i) => (
              <li key={i} className={`flex justify-between gap-3 text-xs ${muted}`}>
                <span className="min-w-0 truncate">
                  <span className={`font-semibold ${strong}`}>{p.title}</span>
                  {p.level != null && <> · level {p.level}</>}
                  {' · '}{DOMAIN_META[p.domain as keyof typeof DOMAIN_META]?.label ?? p.domain}
                </span>
                <span className="flex-shrink-0">{when(p.ts)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
