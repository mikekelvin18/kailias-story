'use client';

// ── Noel says hi on the front page ──
// The front page used to be completely silent, so a family opening the
// app heard nothing at all. Phones only allow sound after a tap, so Noel
// can't talk the moment the page opens; instead a little speech bubble
// invites a tap, and tapping Noel, Kailia or the bubble plays his
// recorded hello (lib/voice.ts). Nothing is ever recorded or sent.

import { useEffect, useState } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { say, hush, onTalking } from '@/lib/voice';
import { soundEnabled } from '@/lib/accessibility';

// Recorded in Noel's voice (scripts/voice-lines.mjs picks these up).
const HELLO = "Hi, friend! I'm Noel. Kailia and I are going on a big adventure. Will you come with us?";

export default function NoelHello() {
  const [talking, setTalking] = useState(false);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    const off = onTalking(setTalking);
    return () => { off(); hush(); };
  }, []);

  const hello = () => {
    setHeard(true);
    if (soundEnabled()) say(HELLO);
  };

  return (
    <div className="relative flex flex-col items-center mb-4">
      {/* speech bubble: an invitation before the first tap, Noel's words after */}
      <button type="button" onClick={hello}
        aria-label={heard ? 'Hear Noel again' : 'Tap to hear Noel say hi'}
        className={`relative mb-2 flex items-center gap-2 rounded-full px-4 py-2 text-base font-extrabold text-purple-900 shadow-lg transition-transform active:scale-95 hover:scale-105 ${heard ? '' : 'kp-hop'}`}
        style={{ background: 'rgba(255,255,255,0.96)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#7C3AED" stroke="#7C3AED" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M15.5 9a4 4 0 0 1 0 6" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"
            style={{ opacity: talking ? 1 : 0.55 }} />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"
            style={{ opacity: talking ? 1 : 0.3 }} />
        </svg>
        <span>{heard ? 'Hi, friend!' : 'Tap to say hi!'}</span>
        {/* the bubble's little tail, pointing down at Noel */}
        <span aria-hidden="true" className="absolute left-[62%] -bottom-[7px] w-4 h-4 rotate-45"
          style={{ background: 'rgba(255,255,255,0.96)' }} />
      </button>

      {/* Kailia and Noel, standing together and breathing, blinking and
          turning a little; tap either one and they hop, and Noel says hi. */}
      <div className="flex items-end justify-center gap-2 cursor-pointer" style={{ minHeight: 130 }} onClick={hello}>
        <KailiaSprite size={104} expression="happy" />
        <PandaSprite size={114} expression="happy" />
      </div>
    </div>
  );
}
