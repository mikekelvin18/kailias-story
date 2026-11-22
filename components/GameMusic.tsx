'use client';

// ── Music + its on/off button ──
// Plays the soft background loop (lib/music.ts) inside the games, and
// the welcome theme on the front page, the story and the map, and
// shows one small round button in the bottom corner to turn it off or
// on. Grown-up pages (Parent Zone, results, sign-up...) stay quiet.
// Mounted once in app/layout.tsx, so the tune carries on across pages. The choice is saved on this device (a display setting, not child
// data) and also lives in Grown-ups > Display & accessibility.
//
// Browsers only allow sound after the first tap, so the music starts on
// the first tap (finger lifted) or key press, fading in gently.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { A11Y_EVENT, musicEnabled, updateA11yPrefs, masterVolume } from '@/lib/accessibility';
import { music, WELCOME } from '@/lib/music';

/** Listening games, where music would cover the sounds the child must hear. */
const LISTENING_GAMES = ['/play/echo-song'];

/** The front page, the story, the map and the try-a-game page: the welcome theme. */
const WELCOME_PAGES = ['/', '/story', '/play', '/try'];

/** Which tune a page plays, or null for a quiet page. */
function tuneFor(path: string): string | null {
  if (WELCOME_PAGES.includes(path)) return WELCOME;
  if (path.startsWith('/play/') && !LISTENING_GAMES.some(g => path.startsWith(g))) return path.split('/').slice(0, 3).join('/');
  return null;
}

export default function GameMusic() {
  const path = usePathname() ?? '';
  const tune = tuneFor(path);
  const inGame = tune !== null; // a page with music
  const [on, setOn] = useState(true);
  const [hidden, setHidden] = useState(true); // nothing on screen until we know the setting
  // the sound panel (Muse round 4: a volume control inside every game)
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(1);
  const showButton = path.startsWith('/play/') || tune !== null;

  // keep the button in step with the setting, wherever it is changed
  useEffect(() => {
    const sync = () => { setOn(musicEnabled()); setVol(masterVolume()); setHidden(false); };
    sync();
    window.addEventListener(A11Y_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(A11Y_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  // each game gets its own tune
  useEffect(() => { if (tune) music().choose(tune); }, [tune]);

  useEffect(() => {
    const m = music();
    if (!inGame || !on) { m.stop(); return; }
    // Already tapped on an earlier page (e.g. the map): start now. Phones may
    // still hold it silent until a tap on this page, so a tap here always
    // (re)starts it too; start() on a playing tune only wakes it up.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua?.hasBeenActive && musicEnabled()) m.start();
    // On iPhones only a finger LIFTING (touchend/click) lets sound start, not
    // touching down, so listen for those, on every tap: start() on a tune
    // that's already playing just wakes it if the phone paused it.
    const go = () => { if (musicEnabled()) m.start(); };
    const events = ['touchend', 'click', 'keydown', 'mouseup'] as const;
    events.forEach(e => window.addEventListener(e, go, true));
    return () => events.forEach(e => window.removeEventListener(e, go, true));
  }, [inGame, on]);

  // leave the games entirely: fade out
  useEffect(() => () => music().stop(), []);

  // quiet when the app is in the background
  useEffect(() => {
    const vis = () => (document.hidden ? music().pause() : music().resume());
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  // close the panel on a tap anywhere else
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!(e.target as Element)?.closest?.('[data-sound-panel]')) setOpen(false); };
    window.addEventListener('pointerdown', close, true);
    return () => window.removeEventListener('pointerdown', close, true);
  }, [open]);

  if (!showButton || hidden) return null;

  const toggle = () => {
    const next = !on;
    // turning music on also lifts "reduce sound", otherwise nothing would play
    updateA11yPrefs(next ? { musicOn: true, reducedSound: false } : { musicOn: false });
    setOn(next);
    if (next) music().start(); else music().stop();
  };

  const setVolume = (v: number) => {
    setVol(v);
    // moving the volume up also lifts "reduce sound", otherwise nothing would play
    updateA11yPrefs(v > 0 ? { volume: v, reducedSound: false } : { volume: v });
  };

  return (
    <div data-sound-panel className="fixed z-[60]"
      style={{
        right: 'max(14px, env(safe-area-inset-right))',
        // the map has the bottom tab bar (about 68px, more on computers): sit just above it
        bottom: path === '/play' ? 'calc(env(safe-area-inset-bottom, 0px) + 92px)' : 'max(14px, env(safe-area-inset-bottom))',
      }}>
      {open && (
        <div className="absolute bottom-[56px] right-0 w-56 rounded-2xl p-3 shadow-xl"
          style={{ background: 'rgba(255,255,255,0.97)', border: '2px solid rgba(124,58,237,0.35)' }}>
          <label htmlFor="kp-game-volume" className="block text-xs font-extrabold text-violet-800 mb-1">Volume</label>
          <input id="kp-game-volume" type="range" min={0} max={100} step={5} value={Math.round(vol * 100)}
            onChange={e => setVolume(Number(e.target.value) / 100)}
            className="w-full accent-violet-600" aria-valuetext={`${Math.round(vol * 100)} percent`} />
          {inGame && (
            <button type="button" onClick={toggle} aria-pressed={on}
              className="mt-2 w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-violet-800"
              style={{ background: '#F5F3FF' }}>
              <span>Music</span><span>{on ? 'On' : 'Off'}</span>
            </button>
          )}
        </div>
      )}
      <button type="button" onClick={() => setOpen(o => !o)}
        aria-label="Sound and volume" aria-expanded={open}
        title="Sound and volume"
        className="grid place-items-center rounded-full transition-transform active:scale-90 hover:scale-105"
        style={{
          width: 46, height: 46,
          background: 'rgba(255,255,255,0.92)',
          border: '2px solid rgba(124,58,237,0.35)',
          boxShadow: '0 4px 14px rgba(20,10,60,0.28)',
        }}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#7C3AED" stroke="#7C3AED" strokeWidth="1.6" strokeLinejoin="round" />
          {vol > 0 && <path d="M15.5 9a4 4 0 0 1 0 6" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />}
          {vol > 0.5 && <path d="M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />}
          {vol === 0 && <path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />}
        </svg>
      </button>
    </div>
  );
}
