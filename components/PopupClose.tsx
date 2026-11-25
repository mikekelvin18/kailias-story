'use client';

import { createPortal } from 'react-dom';

// Puts a pop-up straight on <body>, so nothing on the page (the sound
// button, a map layer) can sit on top of it.
export function OnTop({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

// The one "X" every pop-up box uses: a big white circle (48px, a whole
// fingertip) tucked fully inside the box's top-right corner, so it is easy
// to find, easy to tap, and never cut off by the edge of a phone screen.
// Put it inside a `relative` box (not one with overflow hidden).
export default function PopupClose({ onClose, label = 'Close', color = '#7C3AED', buttonRef }: {
  onClose: () => void; label?: string; color?: string; buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button ref={buttonRef} type="button" onClick={onClose} aria-label={label}
      className="absolute top-2 right-2 z-30 w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
      style={{ background: '#FFFFFF', border: `3px solid ${color}`, boxShadow: '0 6px 16px rgba(20,10,50,0.35)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" stroke="#3B2F63" strokeWidth="3.4" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
