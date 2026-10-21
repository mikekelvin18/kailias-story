'use client';

// ── Practice focus (Parent Zone) ──
// The parent picks one friend = one skill to lean on. The friends' screen
// highlights that friend and the daily care pet uses it too. Saved with
// the child's rewards (lib/rewards.ts get/setFocusCompanion).

import { useEffect, useState } from 'react';
import { COMPANIONS, getFocusCompanion, setFocusCompanion } from '@/lib/rewards';
import { TRAILS } from '@/lib/companionTrails';

export default function FocusPicker({ childName }: { childName: string }) {
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => { setFocus(getFocusCompanion()); }, [childName]);

  function pick(name: string | null) {
    setFocus(setFocusCompanion(name).focusCompanion ?? null);
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        {`Pick one skill for ${childName} to practice. That friend leads the way in Friends' adventures, `
          + 'which open after all six lands. You can change it any time. This is a guide for play, not a diagnosis.'}
      </p>
      <div role="radiogroup" aria-label="Practice focus" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TRAILS.map(t => {
          const c = COMPANIONS.find(x => x.name === t.pet)!;
          const on = focus === t.pet;
          return (
            <button key={t.slug} role="radio" aria-checked={on} onClick={() => pick(on ? null : t.pet)}
              className="flex items-center gap-2 min-h-[56px] p-2 rounded-2xl text-left transition-colors"
              style={{ background: on ? '#EDE9FE' : '#F1F5F9', border: on ? '2px solid #7C3AED' : '2px solid transparent' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.art} alt="" width={40} height={40} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
              <span className="min-w-0 leading-tight">
                <span className="block text-sm font-extrabold" style={{ color: on ? '#5B21B6' : '#334155' }}>{t.skillLabel}</span>
                <span className="block text-xs text-gray-500">with {t.pet}</span>
              </span>
            </button>
          );
        })}
      </div>
      {focus && (
        <button onClick={() => pick(null)} className="mt-3 min-h-[44px] px-3 text-sm font-bold text-gray-500">
          Clear the focus
        </button>
      )}
    </div>
  );
}
