'use client';

// ── "Tap to start!" when the app opens ──
// Phones keep every page silent until the first tap. Instead of pointing at
// the speaker (Kelvin, 2026-11-23: "what is the point of the finger to the
// speaker area if it auto make sound?"), the app opens with one friendly
// start moment: Noel waves over a big glowing start button and Kelvin's own
// pointing-hand picture (public/pointer/hand.webp) taps it. That one tap is
// part of the game, and it is also what lets the music and Noel's voice play.
//
// Shown only on pages with sound (front page, story, map, games, try-a-game),
// only when the page was opened fresh (no tap yet this visit), and it closes
// on the first tap anywhere on it. Reopening a backgrounded app doesn't show
// it again (the first tap there restarts sound by itself, see SoundStart).
// Mounted once in app/layout.tsx.

import { useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import PandaSprite from '@/components/characters/PandaSprite';
import { say } from '@/lib/voice';
import { HELLO } from '@/components/NoelHello';

const SOUND_PAGES = ['/', '/story', '/play', '/try'];
const wantsStart = (path: string) => SOUND_PAGES.includes(path) || path.startsWith('/play/');

// Decided once, on the first look in the browser: had this visit been
// tapped already (a page reached by tapping a link) or not?
let freshVisit: boolean | null = null;
function isFresh() {
  if (freshVisit === null) {
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    freshVisit = !ua?.hasBeenActive;
  }
  return freshVisit;
}
const noop = () => () => {};

function Note({ color, d }: { color: string; d: string }) {
  return (
    <svg width="22" height="24" viewBox="0 0 18 20" aria-hidden="true">
      <path d={d} fill={color} stroke="#3b2416" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export default function TapToStart() {
  const path = usePathname() ?? '';
  const fresh = useSyncExternalStore(noop, isFresh, () => false);
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone || !fresh || !wantsStart(path)) return null;

  const start = () => {
    if (closing) return;
    freshVisit = false;
    setClosing(true);
    // On the front page, Noel says hi right away (this tap lets him talk).
    if (path === '/') say(HELLO);
    setTimeout(() => setGone(true), 380);
  };

  return (
    <div role="dialog" aria-label="Tap to start" onClick={start}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        background: 'radial-gradient(120% 90% at 50% 45%, rgba(76,52,170,0.82) 0%, rgba(30,18,72,0.92) 70%)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        opacity: closing ? 0 : 1, transition: 'opacity 0.35s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      {/* Noel waves above the button */}
      <div className="kp-hop mb-2" aria-hidden="true">
        <PandaSprite size={150} expression="excited" />
      </div>

      <div className="relative">
        {/* the big start button: glows, sends out ripples, music notes float up */}
        <span aria-hidden="true" className="kp-start-glow pointer-events-none absolute inset-0 rounded-full" />
        <span aria-hidden="true" className="kp-start-ripple pointer-events-none absolute inset-0 rounded-full" />
        <span aria-hidden="true" className="kp-start-ripple pointer-events-none absolute inset-0 rounded-full" style={{ animationDelay: '1s' }} />
        <button type="button" autoFocus onClick={e => { e.stopPropagation(); start(); }}
          className="relative grid place-items-center rounded-full text-center font-extrabold text-purple-950 outline-none active:scale-95 transition-transform"
          style={{
            width: 176, height: 176,
            background: 'radial-gradient(circle at 38% 30%, #FFF7C2 0%, #FDE047 38%, #F59E0B 100%)',
            border: '5px solid #fff',
            boxShadow: '0 10px 30px rgba(20,10,60,0.45), inset 0 -8px 16px rgba(180,83,9,0.35)',
          }}>
          <span className="flex flex-col items-center gap-1">
            <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l10.5-6.5z" fill="#4C1D95" stroke="#4C1D95" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="text-xl leading-tight">Tap to start!</span>
          </span>
        </button>
        <span aria-hidden="true" className="kp-taphint-note pointer-events-none absolute" style={{ top: -10, left: '18%' }}>
          <Note color="#FDE68A" d="M7 3v11.2A3.2 3.2 0 1 0 9 17V7.5l6-1.6V2z" />
        </span>
        <span aria-hidden="true" className="kp-taphint-note pointer-events-none absolute" style={{ top: -10, left: '66%', animationDelay: '1.1s' }}>
          <Note color="#C4B5FD" d="M8 2v12.2A3.2 3.2 0 1 0 10 17V6c2 0 4 1.2 4.6 3.4C15.4 5 12 3.4 10 2z" />
        </span>
        {/* Kelvin's pointing hand, tapping the button from the lower right */}
        <span aria-hidden="true" className="pointer-events-none absolute" style={{ right: -62, bottom: -58 }}>
          <span className="kp-taphint-tap block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pointer/hand.webp" alt="" width={104} height={104} draggable={false}
              style={{ filter: 'drop-shadow(0 6px 8px rgba(10,5,30,0.45))' }} />
          </span>
        </span>
      </div>
    </div>
  );
}
