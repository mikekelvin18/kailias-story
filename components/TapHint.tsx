'use client';

// ── "Tap here for sound" hint ──
// Phones keep every page silent until the first tap, so a child (or parent)
// needs to know where to tap to hear Noel. Kelvin (2026-11-22) asked for a
// friendly pointer. Then (same day): "more a pointing finger or other more
// visual cues", so a big cartoon pointing glove floats beside the button and
// taps it every two seconds, a ripple ring spreads out with each tap, the
// button breathes with a warm glow, music notes float up, and an optional
// word bubble ("Tap for sound!") sits beside it.
// It shows only until the first tap of the visit, then it's gone.
//
// The glove is a simple cartoon shape, never a realistic hand (Kelvin found
// realistic code-drawn hands scary), with the app's warm brown outline.
// Reduce motion: the glove and glow stay still, no ripples or notes.

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

/**
 * A friendly cartoon pointing glove (Kelvin, 2026-11-22: "more a pointing
 * finger"). Simple rounded shapes like a classic cartoon glove, never a
 * realistic hand. Drawn pointing up, turned to point up-left at the target.
 */
function Pointer({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
      // a soft shadow so it lifts off light and dark screens alike
      style={{ filter: 'drop-shadow(0 3px 4px rgba(20,10,40,0.4))', overflow: 'visible' }}>
      <g transform="rotate(-38 32 32)" stroke="#3b2416" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="#FFFDF8">
        <rect x="18" y="50" width="26" height="10" rx="4" fill="#FCD34D" />
        <path d="M18 34 Q18 28 24 28 L42 28 Q48 28 48 35 L48 44 Q48 52 40 52 L25 52 Q18 52 18 45 Z" />
        <rect x="21" y="3" width="11" height="34" rx="5.5" />
        <rect x="31" y="27" width="17" height="8" rx="4" />
        <rect x="31" y="34" width="17" height="8" rx="4" />
        <rect x="31" y="41" width="15.5" height="8" rx="4" />
        <path d="M19 37 Q14 37 14 42 Q14 47 20 47 L33 47 Q37 47 37 43 Q37 40 33 40 L24 40" />
        <ellipse cx="24.5" cy="10" rx="1.4" ry="3.2" fill="#fff" stroke="none" />
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
 * `paw` = where the pointing glove sits; `label` = a short word bubble beside it.
 */
export default function TapHint({ show, children, paw = 'below-right', pawSize = 64, glow = '253,224,71', label, className = '' }: {
  show: boolean;
  children: ReactNode;
  /** where the glove sits: below-right of the target pointing up-left, or above-left pointing down-right (for a button in a bottom corner) */
  paw?: 'below-right' | 'above-left' | 'none';
  pawSize?: number;
  /** a few words beside the target, e.g. "Tap for sound!" (shown to the left of it) */
  label?: string;
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
          {label && (
            <span aria-hidden="true" className="kp-taphint-label pointer-events-none absolute whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-extrabold text-purple-900"
              style={{ right: '100%', top: '50%', marginRight: paw === 'above-left' ? pawSize * 0.55 : 12, background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 14px rgba(20,10,60,0.3)', border: '2px solid rgba(124,58,237,0.35)' }}>
              {label}
            </span>
          )}
          {paw !== 'none' && (
            <span aria-hidden="true" className="kp-taphint-paw pointer-events-none absolute z-10"
              style={paw === 'below-right'
                ? { bottom: -pawSize * 0.62, right: -pawSize * 0.86 }
                : { top: -pawSize * 0.72, left: -pawSize * 0.72, transform: 'rotate(180deg)' }}>
              <span className="kp-taphint-tap block"><Pointer size={pawSize} /></span>
            </span>
          )}
        </>
      )}
    </span>
  );
}
