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
import { unlockVoice } from '@/lib/voice';
import { audioCtx, keepSoundOn, markAudioStale, pauseSoundKeeper } from '@/lib/sfx';
import { music } from '@/lib/music';
import { endedAScroll } from '@/lib/tapGuard';

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
    // Every tap, for as long as the app is open (cheap when sound already
    // runs): an iPhone home-screen app that was in the background comes back
    // with its sound engines stuck silent, and only a tap can start them again.
    function wake(e: Event) {
      // the end of a scroll is not a tap: waking the sound engines then cut Noel off
      if (endedAScroll(e)) return;
      keepSoundOn(); // iPhone: music and effects play even with the silent switch on
      unlockVoice();
      audioCtx(true); // made (or made fresh) inside the tap, so later beeps can play
    }
    events.forEach(e => window.addEventListener(e, wake, true));
    // background: rest; back again (or the page restored from memory): the
    // next tap starts everything fresh
    const vis = () => { if (document.hidden) pauseSoundKeeper(); else markAudioStale(); };
    const shown = (e: PageTransitionEvent) => { if (e.persisted) { markAudioStale(); music().markStale(); } };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', shown);
    return () => {
      events.forEach(e => window.removeEventListener(e, wake, true));
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', shown);
    };
  }, []);
  return null;
}
