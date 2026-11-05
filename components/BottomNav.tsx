'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHubTheme } from '@/hooks/useHubTheme';

// ── Persistent bottom navigation ──
// The single biggest "where do I even find this" complaint: every hub
// screen used to bury its links as small text at the bottom of a long
// scroll. This bar is fixed, always visible, and thumb-reachable on any
// hub screen (world map, activities, printables, family). Individual
// mini-games intentionally do NOT include this — they're full-bleed
// experiences with their own "← back" link, and adding a persistent bar
// there would eat into precious play space.

const TABS = [
  { href: '/play', label: 'Map', emoji: '🗺️' },
  { href: '/activities', label: 'Quests', emoji: '🎒' },
  { href: '/printables', label: 'Print', emoji: '🖨️' },
  { href: '/family', label: 'Family', emoji: '👪' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useHubTheme();

  return (
    <nav aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-0 sm:px-4 sm:pb-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Phone: a flush full-width bar. Tablet/desktop: a floating rounded
          dock sized to the page content. A SOLID surface (not see-through
          glass) so the tabs never blend into the map behind them. */}
      <div className="w-full max-w-md sm:max-w-xl lg:max-w-2xl flex items-stretch gap-1 px-2 py-1.5 sm:rounded-3xl"
        style={{ background: theme.navBg, borderTop: `1px solid ${theme.navBorder}`,
          boxShadow: '0 -2px 14px rgba(15,23,42,0.10)' }}>
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          return (
            <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] rounded-2xl transition-colors active:scale-95"
              style={{ color: active ? theme.navActive : theme.navInactive }}>
              {/* The active tab gets a filled pill behind its icon (the
                  iOS/Android pattern) — far easier to spot than the old
                  tiny dot, especially for pre-readers. */}
              <span className="flex items-center justify-center rounded-full text-2xl sm:text-[1.7rem] leading-none transition-colors"
                style={{ width: 56, height: 32, background: active ? theme.navActiveBg : 'transparent',
                  filter: active ? 'none' : 'saturate(0.75)' }}>
                {tab.emoji}
              </span>
              <span className={`text-xs sm:text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
