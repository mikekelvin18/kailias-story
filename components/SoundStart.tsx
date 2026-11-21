'use client';

// ── Sound wakes up on the first tap ──
// Phones and browsers keep every page silent until the person taps it
// (iPhone Safari is the strictest), and an iPhone with its silent switch
// on also mutes game music and sound effects. Mounted once in
// app/layout.tsx, this:
//  - tells iPhones this app plays sound on purpose (like a music app), so
//    the silent switch doesn't mute the music and sound effects;
//  - on the very first tap or key press anywhere, wakes up Noel's voice,
//    the sound effects and the music, and plays the Noel line that was
//    waiting for that tap (lib/voice.ts unlockVoice).
// It never shows anything and never listens: it only lets sound play.

import { useEffect } from 'react';
import { unlockVoice } from '@/lib/voice';
import { audioCtx } from '@/lib/sfx';

export default function SoundStart() {
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch { /* older browsers: nothing to do */ }

    const events = ['pointerdown', 'touchend', 'keydown', 'click'] as const;
    const wake = () => {
      events.forEach(e => window.removeEventListener(e, wake, true));
      unlockVoice();
      audioCtx(); // made (and woken) inside the tap, so later beeps can play
    };
    events.forEach(e => window.addEventListener(e, wake, true));
    return () => events.forEach(e => window.removeEventListener(e, wake, true));
  }, []);
  return null;
}
