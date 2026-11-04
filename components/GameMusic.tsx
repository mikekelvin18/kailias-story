'use client';

// ── Game music + its on/off button ──
// Plays the soft background loop (lib/music.ts) inside the games and
// shows one small round button in the bottom corner to turn it off or
// on. The choice is saved on this device (a display setting, not child
// data) and also lives in Grown-ups > Display & accessibility.
//
// Browsers only allow sound after the first tap, so the music starts on
// the first touch or key press, fading in gently.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { A11Y_EVENT, musicEnabled, updateA11yPrefs } from '@/lib/accessibility';
import { music } from '@/lib/music';

/** The world map itself stays quiet; music is for the games. */
function isGame(path: string) {
  return path.startsWith('/play/');
}

export default function GameMusic() {
  const path = usePathname() ?? '';
  const inGame = isGame(path);
  const [on, setOn] = useState(true);
  const [hidden, setHidden] = useState(true); // nothing on screen until we know the setting

  // keep the button in step with the setting, wherever it is changed
  useEffect(() => {
    const sync = () => { setOn(musicEnabled()); setHidden(false); };
    sync();
    window.addEventListener(A11Y_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(A11Y_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  // each game gets its own tune
  useEffect(() => { if (inGame) music().choose(path.split('/').slice(0, 3).join('/')); }, [inGame, path]);

  useEffect(() => {
    const m = music();
    if (!inGame || !on) { m.stop(); return; }
    if (m.playing) return;
    // wait for the first tap: browsers block sound until then
    const go = () => { if (musicEnabled()) m.start(); };
    const opts = { once: true, capture: true } as const;
    window.addEventListener('pointerdown', go, opts);
    window.addEventListener('keydown', go, opts);
    return () => { window.removeEventListener('pointerdown', go, opts); window.removeEventListener('keydown', go, opts); };
  }, [inGame, on]);

  // leave the games entirely: fade out
  useEffect(() => () => music().stop(), []);

  // quiet when the app is in the background
  useEffect(() => {
    const vis = () => (document.hidden ? music().pause() : music().resume());
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  if (!inGame || hidden) return null;

  const toggle = () => {
    const next = !on;
    // turning music on also lifts "reduce sound", otherwise nothing would play
    updateA11yPrefs(next ? { musicOn: true, reducedSound: false } : { musicOn: false });
    setOn(next);
    if (next) music().start(); else music().stop();
  };

  return (
    <>
    {/* room at the end of scrolling pages so the button never sits on the last thing */}
    <div aria-hidden="true" style={{ height: 64, flexShrink: 0 }} />
    <button type="button" onClick={toggle}
      aria-label={on ? 'Turn music off' : 'Turn music on'} aria-pressed={on}
      title={on ? 'Music on' : 'Music off'}
      className="fixed z-[60] grid place-items-center rounded-full transition-transform active:scale-90 hover:scale-105"
      style={{
        right: 'max(14px, env(safe-area-inset-right))',
        bottom: 'max(14px, env(safe-area-inset-bottom))',
        width: 46, height: 46,
        background: 'rgba(255,255,255,0.92)',
        border: '2px solid rgba(124,58,237,0.35)',
        boxShadow: '0 4px 14px rgba(20,10,60,0.28)',
        opacity: on ? 1 : 0.85,
      }}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17.5V6.2l10-2.2v11.3" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="6.6" cy="17.6" rx="2.9" ry="2.3" fill="#7C3AED" />
        <ellipse cx="16.6" cy="15.4" rx="2.9" ry="2.3" fill="#7C3AED" />
        {!on && <path d="M3.5 3.5l17 17" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" />}
      </svg>
    </button>
    </>
  );
}
