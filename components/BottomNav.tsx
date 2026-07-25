'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Persistent bottom navigation ──
// The single biggest "where do I even find this" complaint: every hub
// screen used to bury its links as small text at the bottom of a long
// scroll. This bar is fixed, always visible, and thumb-reachable on any
// hub screen (world map, activities, printables, family). Individual
// mini-games intentionally do NOT include this — they're full-bleed
// experiences with their own "← back" link, and adding a persistent bar
// there would eat into precious play space.

const TABS = [
  { href: '/play', label: 'Home', emoji: '🏠' },
  { href: '/activities', label: 'Quests', emoji: '🎒' },
  { href: '/printables', label: 'Print', emoji: '🖨️' },
  { href: '/family', label: 'Family', emoji: '👪' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="w-full max-w-md flex items-stretch"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
          borderTop: '1.5px solid rgba(30,41,59,0.1)', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2 transition-transform active:scale-95"
              style={{ color: active ? '#7C3AED' : '#94a3b8' }}>
              <span className="text-2xl" style={{ transform: active ? 'translateY(-1px)' : 'none' }}>{tab.emoji}</span>
              <span className="text-[10px] font-extrabold mt-0.5">{tab.label}</span>
              {active && <span className="block rounded-full mt-0.5" style={{ width: 4, height: 4, background: '#7C3AED' }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
