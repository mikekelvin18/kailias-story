'use client';

import { useEffect, useState } from 'react';
import { weekSummary, type WeekSummary } from '@/lib/weeklySummary';

// "This week" card on the Family page: counts of practice in plain words,
// never scores. Reads only this device (lib/weeklySummary.ts). The pet line
// counts days together and never mentions a missed day (no guilt).

export default function WeeklySummary({ childName }: { childName: string }) {
  const [week, setWeek] = useState<WeekSummary | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reads this device's storage after mount
  useEffect(() => { setWeek(weekSummary()); }, []);
  if (!week) return null;

  const top = week.lines[0];
  return (
    <section aria-label="This week" data-weekly-summary className="rounded-3xl p-5 mb-4 bg-white">
      <p className="text-sm font-extrabold uppercase tracking-wide text-violet-700 mb-1">This week</p>
      {week.total === 0 && week.petDays === 0 ? (
        <p className="text-base text-slate-700">
          A fresh week! Pick any game or a together quest, and {childName}&apos;s practice will show up here.
        </p>
      ) : (
        <>
          {top && (
            <p className="text-lg font-extrabold text-slate-800 leading-snug">
              This week {childName} practiced {top.words} {top.times === 1 ? 'once' : `${top.times} times`}!
            </p>
          )}
          {week.lines.length > 1 && (
            <ul className="mt-2 space-y-1">
              {week.lines.slice(1).map(l => (
                <li key={l.area} className="text-base text-slate-700">
                  {l.words[0].toUpperCase() + l.words.slice(1)}: {l.times === 1 ? 'once' : `${l.times} times`}
                </li>
              ))}
            </ul>
          )}
          {week.togetherQuests > 0 && (
            <p className="text-base text-slate-700 mt-2">
              You did {week.togetherQuests} together {week.togetherQuests === 1 ? 'quest' : 'quests'}. That time together matters most.
            </p>
          )}
          {week.petDays > 0 && (
            <p className="text-base text-slate-700 mt-2">
              {childName} looked after their pet friend on {week.petDays} {week.petDays === 1 ? 'day' : 'days'}.
            </p>
          )}
        </>
      )}
      <p className="text-sm text-slate-500 mt-3">Counted on this device only. Practice, not scores.</p>
    </section>
  );
}
