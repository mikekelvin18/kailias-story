'use client';

// ── The moon button: calm mode on the map ──
// The same switch as Parent Zone > Display > Calm mode (lib/accessibility.ts
// `calmMode`): plain backgrounds, nothing pulsing or sparkling and less
// movement in every game (the rules live in app/globals.css under
// "Calm mode"). A sleepy crescent moon with the word "Calm", so it never
// looks like the day/night switch beside it.

import { useEffect, useState } from 'react';
import { A11Y_EVENT, loadA11y, updateA11yPrefs } from '@/lib/accessibility';

export default function CalmToggle() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const read = () => setCalm(loadA11y().calmMode);
    read();
    window.addEventListener(A11Y_EVENT, read);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener(A11Y_EVENT, read); window.removeEventListener('storage', read); };
  }, []);

  return (
    <button type="button" onClick={() => updateA11yPrefs({ calmMode: !calm })}
      aria-pressed={calm} aria-label={calm ? 'Calm mode is on. Tap to turn it off' : 'Calm mode: tap for a quieter, stiller screen'}
      title={calm ? 'Calm mode on' : 'Calm mode off'}
      className="kp-tap-pad inline-flex items-center gap-1 rounded-full font-extrabold text-base flex-shrink-0 transition-colors active:scale-95"
      style={{
        height: 40, padding: '0 12px 0 8px',
        background: calm ? '#312E81' : 'rgba(255,255,255,0.92)',
        color: calm ? '#FEF3C7' : '#4C1D95',
        border: `2px solid ${calm ? '#A5B4FC' : 'rgba(124,58,237,0.35)'}`,
        boxShadow: '0 3px 10px rgba(20,10,60,0.18)',
      }}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        {/* a crescent moon, resting */}
        <path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z"
          fill={calm ? '#FDE68A' : '#C4B5FD'} stroke={calm ? '#FDE68A' : '#6D28D9'} strokeWidth="1.6" strokeLinejoin="round" />
        {calm && <path d="M17 6h3l-3 3.2h3" fill="none" stroke="#FEF3C7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      Calm
    </button>
  );
}
