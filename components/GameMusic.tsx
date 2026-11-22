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

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { A11Y_EVENT, musicEnabled, soundEnabled, updateA11yPrefs, setMutedNow } from '@/lib/accessibility';
import { hush } from '@/lib/voice';
import { music, WELCOME } from '@/lib/music';
import TapHint from '@/components/TapHint';

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
  const [soundOn, setSoundOn] = useState(true); // the one sound button: everything on, or off
  // Phones keep every page silent until the first tap: until then the button
  // gently pulses, so it's clear a tap brings the sound.
  const [tapped, setTapped] = useState(false);
  const firstTapAt = useRef(0);
  useEffect(() => {
    const events = ['touchend', 'click', 'keydown', 'mouseup'] as const;
    const done = () => { firstTapAt.current = Date.now(); setTapped(true); events.forEach(e => window.removeEventListener(e, done, true)); };
    events.forEach(e => window.addEventListener(e, done, true));
    return () => events.forEach(e => window.removeEventListener(e, done, true));
  }, []);
  const showButton = path.startsWith('/play/') || tune !== null;

  // keep the button in step with the setting, wherever it is changed
  useEffect(() => {
    const sync = () => { setOn(musicEnabled()); setSoundOn(soundEnabled()); setHidden(false); };
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
    const go = () => { if (musicEnabled()) m.start(true); };
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

  if (!showButton || hidden) return null;

  // One button (Kelvin: "just have a button to turn it off"): tap for all
  // sound off (Noel, music, effects), tap again for all on. How loud is the
  // device's own volume.
  const toggle = () => {
    // The very first tap of a visit, if it lands on this button, is someone
    // asking for sound (it was silent only because the phone waits for a
    // tap), so it starts the sound instead of turning it off.
    if (soundOn && Date.now() - firstTapAt.current < 800) { if (inGame) music().start(true); return; }
    const next = !soundOn;
    // off: only until the app is opened again (never saved); on: also clears an old saved "off"
    setMutedNow(!next);
    if (next) updateA11yPrefs({ reducedSound: false, musicOn: true });
    setSoundOn(next); setOn(next);
    if (next) { if (inGame) music().start(true); } else { music().stop(); hush(); }
  };

  return (
    <div className="fixed z-[60]"
      style={{
        right: 'max(14px, env(safe-area-inset-right))',
        // the map has the bottom tab bar (about 68px, more on computers): sit just above it
        bottom: path === '/play' ? 'calc(env(safe-area-inset-bottom, 0px) + 92px)' : 'max(14px, env(safe-area-inset-bottom))',
      }}>
      {/* until the first tap: glow, ripples, notes, a pointing glove tapping it
          and "Tap for sound!" (the front page points at "Tap to say hi!" instead, so just the glow there) */}
      <TapHint show={!tapped && soundOn} paw={path === '/' ? 'none' : 'above-left'} pawSize={60} label={path === '/' ? undefined : 'Tap for sound!'}>
      <button type="button" onClick={toggle}
        aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'} aria-pressed={!soundOn}
        title={soundOn ? 'Sound on (tap to turn off)' : 'Sound off (tap to turn on)'}
        className={`grid place-items-center rounded-full transition-transform active:scale-90 hover:scale-105 `}
        style={{
          width: 46, height: 46,
          background: 'rgba(255,255,255,0.92)',
          border: '2px solid rgba(124,58,237,0.35)',
          boxShadow: '0 4px 14px rgba(20,10,60,0.28)',
        }}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill={soundOn ? '#7C3AED' : '#94A3B8'} stroke={soundOn ? '#7C3AED' : '#94A3B8'} strokeWidth="1.6" strokeLinejoin="round" />
          {soundOn && <path d="M15.5 9a4 4 0 0 1 0 6" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />}
          {soundOn && <path d="M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />}
          {!soundOn && <path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />}
        </svg>
      </button>
      </TapHint>
    </div>
  );
}
