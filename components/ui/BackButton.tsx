'use client';

import Link from 'next/link';
import { useHubTheme } from '@/hooks/useHubTheme';

// The "← back" link every hub/parent screen has, as a real button-sized
// pill instead of small plain text, so it's easy to spot and easy to
// hit with a thumb (44px tall minimum).
export default function BackButton({ href, label }: { href: string; label: string }) {
  const { theme } = useHubTheme();
  return (
    <Link href={href}
      className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full text-sm font-extrabold shadow-sm transition-transform active:scale-95 whitespace-nowrap"
      style={{ background: theme.backBg, color: theme.backText, border: `1px solid ${theme.navBorder}` }}>
      <span aria-hidden="true">←</span> {label}
    </Link>
  );
}
