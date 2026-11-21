'use client';

// ── Sound wakes up on the first tap ──
// Phones and browsers keep every page silent until the person taps it
// (iPhone Safari is the strictest), and an iPhone with its silent switch
// on also mutes game music and sound effects. Mounted once in
// app/layout.tsx, this:
//  - tells iPhones this app plays sound on purpose (like a music app), so
//    the silent switch doesn't mute the music and sound effects;
//  - on the first real tap (finger lifted) or key press anywhere, wakes up Noel's voice,
//    the sound effects and the music, and plays the Noel line that was
//    waiting for that tap (lib/voice.ts unlockVoice).
// It never shows anything and never listens: it only lets sound play.

import { useEffect } from 'react';
import { unlockVoice, voiceReady } from '@/lib/voice';
import { audioCtx } from '@/lib/sfx';

export default function SoundStart() {
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch { /* older browsers: nothing to do */ }

    // Only these count as a real tap on iPhones: a finger going down
    // (touchstart/pointerdown) does NOT let sound play, lifting it does.
    // Keep trying on every tap until the phone has really let sound out.
    const events = ['touchend', 'click', 'keydown', 'mouseup'] as const;
    const stop = () => events.forEach(e => window.removeEventListener(e, wake, true));
    function wake() {
      unlockVoice();
      const ctx = audioCtx(); // made (and woken) inside the tap, so later beeps can play
      if (voiceReady() && (!ctx || ctx.state === 'running')) stop();
    }
    events.forEach(e => window.addEventListener(e, wake, true));
    return stop;
  }, []);
  return null;
}
