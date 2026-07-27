'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import { WORKSHEETS, CATEGORY_INFO, WorksheetCategory } from '@/lib/worksheets';
import { loadWorksheetProgress } from '@/lib/worksheetProgress';
import { hasActiveConsent } from '@/lib/family';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { useHubTheme } from '@/hooks/useHubTheme';

// ─── Printable Worksheets library ──────────────────────────────────────────────
// Real paper activities parents print at home: tracing sheets progressing
// from simple shapes to curves, line mazes, reading practice, and
// screen-free move/talk cards — spanning every skill domain the app
// measures on-screen. Browsing and printing here is instant; "done" is
// saved only after a parent's own tap, and only when the family has
// consented.

const CATEGORIES = Object.keys(CATEGORY_INFO) as WorksheetCategory[];

export default function PrintablesPage() {
  const [progress, setProgress] = useState<Record<string, { completedAt: string; hasPhoto: boolean }>>({});
  const [consented, setConsented] = useState(false);
  const { theme, name: themeName } = useHubTheme();
  const bright = themeName === 'bright';

  useEffect(() => {
    setProgress(loadWorksheetProgress());
    setConsented(hasActiveConsent());
  }, []);

  const doneCount = Object.keys(progress).length;

  return (
    <main className="min-h-screen pb-24" style={{ background: theme.background }}>
      <div className="max-w-md sm:max-w-xl lg:max-w-3xl mx-auto px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <Link href="/play" className={`text-sm font-bold ${theme.link}`}>← Map</Link>
          <h1 className={`text-xl font-extrabold ${theme.title}`}>🖨️ Printables</h1>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${theme.subtitle}`}>{doneCount}/{WORKSHEETS.length}</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl p-3 mb-4"
          style={{ background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` }}>
          <PandaSprite size={48} expression="happy" style={{ flexShrink: 0 }} />
          <p className={`text-sm font-semibold pt-2 ${theme.subtitle}`}>
            Real paper, real pencils! Print a sheet, trace or play together, then come back and mark it done.
          </p>
        </div>

        {!consented && (
          <Link href="/family" className="block rounded-2xl p-3 mb-4"
            style={{ background: 'rgba(253,224,71,0.14)', border: '1.5px solid rgba(253,224,71,0.4)' }}>
            <p className={bright ? 'text-xs text-amber-900' : 'text-xs text-yellow-100'}>
              ⚠️ <strong>Heads up:</strong> completed worksheets aren&apos;t being saved yet. Set up the
              free family account first — <span className="underline font-bold">tap here for the Parent Zone</span>.
            </p>
          </Link>
        )}

        {CATEGORIES.map(cat => {
          const items = WORKSHEETS.filter(w => w.category === cat);
          const info = CATEGORY_INFO[cat];
          return (
            <section key={cat} className="mb-5">
              <h2 className={`text-sm font-extrabold uppercase tracking-wide mb-2 px-1 ${theme.subtitle}`}>
                {info.emoji} {info.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {items.map(w => {
                  const done = !!progress[w.id];
                  return (
                    <Link key={w.id} href={`/printables/${w.id}`}
                      className="rounded-2xl p-3 transition-transform hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.97)', border: done ? '3px solid #34D399' : '2px solid rgba(255,255,255,0.2)' }}>
                      <span className="block text-3xl mb-1">{w.emoji}</span>
                      <span className="block font-extrabold text-gray-800 text-sm leading-tight">
                        {w.title} {done && '✅'}
                      </span>
                      <span className="block text-[11px] font-semibold text-gray-500 mt-1">{w.blurb}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <BottomNav />
    </main>
  );
}
