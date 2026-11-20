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
import { A11Y_EVENT, musicEnabled, updateA11yPrefs, masterVolume } from '@/lib/accessibility';
import { music } from '@/lib/music';

/** Listening games, where music would cover the sounds the child must hear. */
const LISTENING_GAMES = ['/play/echo-song'];

/** The world map itself stays quiet; music is for the games. */
function isGame(path: string) {
  return path.startsWith('/play/') && !LISTENING_GAMES.some(g => path.startsWith(g));
}

export default function GameMusic() {
  const path = usePathname() ?? '';
  const inGame = isGame(path);
  const [on, setOn] = useState(true);
  const [hidden, setHidden] = useState(true); // nothing on screen until we know the setting
  // the sound panel (Muse round 4: a volume control inside every game)
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(1);
  const showButton = path.startsWith('/play/');

  // keep the button in step with the setting, wherever it is changed
  useEffect(() => {
    const sync = () => { setOn(musicEnabled()); setVol(masterVolume()); setHidden(false); };
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
      style={{ right: 'max(14px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))' }}>
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
