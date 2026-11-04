// ── Noel's voice ──
// Every line the app reads aloud goes through here. It still uses the
// device's own built-in speech voice (free, no network, nothing recorded:
// it only ever SPEAKS, it never listens), but instead of taking whatever
// default voice the browser hands us, which is often the flat robotic
// one, it picks the warmest natural-sounding voice the device has.
//
// Most phones and computers ship a few "natural" or "enhanced" voices
// that sound like a real person. A grown-up can also choose a voice by
// hand in Grown-ups > Display & accessibility (saved on this device only,
// like the other display settings; it is not child data).

import { loadA11y } from './accessibility';

/* Voices we know sound warm and friendly, best first. Matching is by
   name, so "Microsoft Ana Online (Natural)" matches "ana online". */
const FAVOURITES = [
  'ana online',          // Edge: a cheerful child voice
  'jenny online', 'aria online', 'emma online', 'michelle online', 'ava online', 'sonia online', 'libby online', 'natasha online',
  'google us english',   // Chrome: smooth, natural female voice
  'google uk english female',
  'samantha (enhanced)', 'ava (premium)', 'ava (enhanced)', 'zoe (premium)', 'zoe (enhanced)', 'allison (enhanced)',
  'susan (enhanced)', 'serena (enhanced)', 'karen (enhanced)', 'moira (enhanced)', 'tessa (enhanced)',
  'samantha', 'ava', 'zoe', 'karen', 'moira', 'tessa', 'serena', 'allison', 'susan', 'nicky',
];

/* Novelty and very old voices that sound robotic or spooky to a child. */
const NEVER = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical',
  'jester', 'organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'pipe organ', 'fred', 'ralph',
  'kathy', 'junior', 'princess', 'grandma', 'grandpa', 'rocko', 'eddy', 'reed', 'sandy', 'shelley',
  'espeak', 'compact',
];

const NATURAL = /natural|neural|enhanced|premium|online|google|siri/i;

function lowered(v: SpeechSynthesisVoice) { return v.name.toLowerCase(); }

/** How nice a voice is for a child audience. Higher is better, below 0 is "avoid". */
export function voiceScore(v: SpeechSynthesisVoice): number {
  const name = lowered(v);
  if (NEVER.some(n => name.includes(n))) return -100;
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('en')) return -50;
  let s = 0;
  const fav = FAVOURITES.findIndex(f => name.includes(f));
  if (fav >= 0) s += 200 - fav * 3;
  if (NATURAL.test(v.name)) s += 60;
  if (lang === 'en-us') s += 15;
  else if (lang === 'en-gb' || lang === 'en-au' || lang === 'en-ca') s += 8;
  if (v.localService) s += 2; // works offline, starts instantly
  return s;
}

function allVoices(): SpeechSynthesisVoice[] {
  try { return window.speechSynthesis?.getVoices() ?? []; } catch { return []; }
}

/** English voices worth offering a grown-up, best first. */
export function friendlyVoices(): SpeechSynthesisVoice[] {
  return allVoices()
    .filter(v => voiceScore(v) > -50)
    .sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** The voice Noel uses: the grown-up's pick if they made one, else the best available. */
export function chosenVoice(): SpeechSynthesisVoice | null {
  const voices = allVoices();
  if (!voices.length) return null;
  const picked = loadA11y().voiceName;
  if (picked) {
    const v = voices.find(x => x.name === picked);
    if (v) return v;
  }
  const best = [...voices].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
  return best && voiceScore(best) > -50 ? best : null;
}

/** True when the chosen voice is one of the lifelike ones. */
export function isNaturalVoice(v: SpeechSynthesisVoice | null) {
  return !!v && NATURAL.test(v.name);
}

// Voices load a moment after the page does. Ask early so the first line
// is already in the nice voice.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => { window.speechSynthesis.getVoices(); });
  } catch { /* ignore */ }
}

// ── Quieting the music while Noel talks ──
type Listener = (talking: boolean) => void;
const listeners = new Set<Listener>();
export function onTalking(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function setTalking(t: boolean) { listeners.forEach(fn => { try { fn(t); } catch { /* ignore */ } }); }

export interface SayOptions {
  /** 1 = normal speed. Kids' lines default a touch slower. */
  rate?: number;
  /** 1 = the voice's own pitch. Raised a little for a brighter, friendlier sound. */
  pitch?: number;
}

/**
 * Read a line aloud in Noel's warm voice. Emoji are stripped (they read
 * as "sparkles") and longer lines are spoken a sentence at a time with a
 * tiny breath between, which sounds more like a person and avoids a
 * Chrome bug that cuts long lines off.
 */
export function say(text: string, opts: SayOptions = {}) {
  if (typeof window === 'undefined') return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const clean = text.replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/\s+/g, ' ').trim();
    if (!clean) return;

    const voice = chosenVoice();
    const natural = isNaturalVoice(voice);
    const wantPitch = opts.pitch ?? 1.12;
    // Lifelike voices already sound warm; pushing their pitch far makes
    // them sound squeaky, so they get half the lift the robotic ones need.
    const pitch = natural ? 1 + (wantPitch - 1) * 0.5 : wantPitch;
    const rate = opts.rate ?? 0.92;

    const parts = clean.match(/[^.!?]+[.!?]*\s*/g)?.map(p => p.trim()).filter(Boolean) ?? [clean];
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = rate;
      u.pitch = Math.max(0.5, Math.min(2, pitch));
      if (i === 0) u.onstart = () => setTalking(true);
      if (i === parts.length - 1) { u.onend = () => setTalking(false); u.onerror = () => setTalking(false); }
      synth.speak(u);
    });
  } catch { /* reading aloud is a bonus, never an error */ }
}

export function hush() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  setTalking(false);
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
