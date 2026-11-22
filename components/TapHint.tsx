'use client';

// ── "Tap here for sound" hint ──
// Phones keep every page silent until the first tap, so a child (or parent)
// needs to know where to tap to hear Noel. Kelvin (2026-11-22) asked for a
// friendly pointer: Noel's round panda paw floats beside the button and taps
// it every two seconds, a ripple ring spreads out with each tap, the button
// breathes with a warm glow and little music notes float up out of it.
// It shows only until the first tap of the visit, then it's gone.
//
// No human hand is drawn (Kelvin found code-drawn hands scary): the pointer
// is a panda paw in Noel's own colours, with the app's warm brown outline.
// Reduce motion: the paw and glow stay still, no ripples or notes.

import { useSyncExternalStore, type ReactNode } from 'react';

const TAPS = ['touchend', 'click', 'keydown', 'mouseup'] as const;

let tappedOnce = false; // for browsers without navigator.userActivation

function tappedYet() {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return tappedOnce || !!ua?.hasBeenActive;
}

function onFirstTap(cb: () => void) {
  const done = () => { tappedOnce = true; cb(); };
  TAPS.forEach(e => window.addEventListener(e, done, true));
  return () => TAPS.forEach(e => window.removeEventListener(e, done, true));
}

/** True until the first real tap or key press of this visit (false on the server). */
export function useBeforeFirstTap(): boolean {
  return useSyncExternalStore(onFirstTap, () => !tappedYet(), () => false);
}

/** Noel's paw, palm side, toes pointing up-left toward what to tap. */
function Paw({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
      // a white sticker edge so the dark paw shows on dark game screens too
      style={{ filter: 'drop-shadow(0 0 1.2px #fff) drop-shadow(0 0 1.2px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 3px 4px rgba(20,10,40,0.35))', overflow: 'visible' }}>
      <g transform="rotate(-38 32 32)">
        {/* the paw */}
        <ellipse cx="32" cy="32" rx="15" ry="16" fill="#2A211D" stroke="#3b2416" strokeWidth="2.4" />
        {/* toe beans */}
        <circle cx="21.5" cy="18.5" r="5.6" fill="#2A211D" stroke="#3b2416" strokeWidth="2.2" />
        <circle cx="32" cy="13.5" r="6" fill="#2A211D" stroke="#3b2416" strokeWidth="2.2" />
        <circle cx="42.5" cy="18.5" r="5.6" fill="#2A211D" stroke="#3b2416" strokeWidth="2.2" />
        <circle cx="21.5" cy="18.8" r="3" fill="#F9A8C8" />
        <circle cx="32" cy="13.8" r="3.3" fill="#F9A8C8" />
        <circle cx="42.5" cy="18.8" r="3" fill="#F9A8C8" />
        {/* the big pad */}
        <path d="M24 34 Q24 26 32 26 Q40 26 40 34 Q40 41 32 40 Q24 41 24 34 Z" fill="#F9A8C8" />
        <ellipse cx="29" cy="30" rx="3" ry="1.8" fill="#FFFFFF" opacity="0.6" />
      </g>
    </svg>
  );
}

function Note({ variant }: { variant: number }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true">
      {variant === 0 ? (
        <path d="M7 3v11.2A3.2 3.2 0 1 0 9 17V7.5l6-1.6V2z" fill="#FDE68A" stroke="#3b2416" strokeWidth="1.3" strokeLinejoin="round" />
      ) : (
        <path d="M8 2v12.2A3.2 3.2 0 1 0 10 17V6c2 0 4 1.2 4.6 3.4C15.4 5 12 3.4 10 2z" fill="#C4B5FD" stroke="#3b2416" strokeWidth="1.3" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * Wrap the thing to tap. `show` turns the hint on (usually useBeforeFirstTap()).
 * `paw` = where Noel's paw sits.
 */
export default function TapHint({ show, children, paw = 'below-right', pawSize = 46, glow = '253,224,71', className = '' }: {
  show: boolean;
  children: ReactNode;
  /** where the paw sits: below-right of the target pointing up-left, or above-left pointing down-right (for a button in a bottom corner) */
  paw?: 'below-right' | 'above-left' | 'none';
  pawSize?: number;
  /** glow colour as "r,g,b" */
  glow?: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {show && (
        <span aria-hidden="true" className="kp-taphint-glow pointer-events-none absolute inset-0 rounded-full"
          style={{ ['--kp-glow' as string]: glow }} />
      )}
      {show && <span aria-hidden="true" className="kp-taphint-ripple pointer-events-none absolute inset-0 rounded-full" />}
      {children}
      {show && (
        <>
          <span aria-hidden="true" className="kp-taphint-note pointer-events-none absolute" style={{ top: -6, left: '22%' }}><Note variant={0} /></span>
          <span aria-hidden="true" className="kp-taphint-note pointer-events-none absolute" style={{ top: -6, left: '62%', animationDelay: '1.1s' }}><Note variant={1} /></span>
          {paw !== 'none' && (
            <span aria-hidden="true" className="kp-taphint-paw pointer-events-none absolute z-10"
              style={paw === 'below-right'
                ? { bottom: -pawSize * 0.45, right: -pawSize * 0.64 }
                : { top: -pawSize * 0.72, left: -pawSize * 0.72, transform: 'rotate(180deg)' }}>
              <span className="kp-taphint-tap block"><Paw size={pawSize} /></span>
            </span>
          )}
        </>
      )}
    </span>
  );
}
