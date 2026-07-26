'use client';

import { useHubTheme } from '@/hooks/useHubTheme';

// An iPhone-style sliding switch for day/night mode, instead of a plain
// icon button — the slide itself communicates on/off at a glance, and
// the sun/moon icon rides along inside the thumb.
export default function ThemeToggle({ className }: { className?: string }) {
  const { name, toggle } = useHubTheme();
  const dark = name === 'dark';

  return (
    <button onClick={toggle} title={dark ? 'Switch to day mode' : 'Switch to night mode'}
      aria-label={dark ? 'Switch to day mode' : 'Switch to night mode'}
      className={`relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 ${className ?? ''}`}
      style={{ width: 50, height: 28, background: dark ? '#312e81' : '#7dd3fc', border: '1.5px solid rgba(0,0,0,0.08)' }}>
      <span className="absolute rounded-full flex items-center justify-center"
        style={{
          width: 22, height: 22, background: 'white', top: 2,
          left: dark ? 25 : 2,
          transition: 'left 0.22s cubic-bezier(0.34,1.3,0.64,1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          fontSize: 12,
        }}>
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
