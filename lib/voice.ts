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
let talkingNow = false;
export function onTalking(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function setTalking(t: boolean) {
  if (talkingNow === t) return;
  talkingNow = t;
  listeners.forEach(fn => { try { fn(t); } catch { /* ignore */ } });
}
/** True while Noel is in the middle of a line. */
export function isTalking() { return talkingNow; }

export interface SayOptions {
  /** 1 = normal speed. Kids' lines default a touch slower. */
  rate?: number;
  /** 1 = the voice's own pitch. Raised a little for a brighter, friendlier sound. */
  pitch?: number;
}

// Each new line gets a number; anything still waiting from an older line
// (a delayed start, a late "finished" signal) checks it and quietly drops out.
let generation = 0;

/** Chrome and Android load their voices a moment after the page. Wait (briefly)
    so the very first line isn't read in the flat fallback voice. */
function whenVoicesReady(go: () => void) {
  const synth = window.speechSynthesis;
  if (synth.getVoices().length) { go(); return; }
  let done = false;
  const finish = () => { if (done) return; done = true; synth.removeEventListener?.('voiceschanged', finish); go(); };
  synth.addEventListener?.('voiceschanged', finish);
  setTimeout(finish, 900); // some devices never announce: go anyway
}

/** Split into sentences where end punctuation is followed by a new capitalised
    sentence, so "3.5" and "their little song… then echo it" stay whole. */
function sentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…])\s+(?=[A-Z0-9"'“‘])/).map(p => p.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

// ── Noel's recorded voice ──
// Lines that never change ("Tap the fireflies gently to catch them!") are
// recorded ahead of time with a natural human-sounding AI voice by
// scripts/record-voice.mjs and shipped as small audio files in
// public/voice/, listed in public/voice/manifest.json. The app only ever
// PLAYS those files: it never calls a voice service, and no child data is
// ever sent anywhere. A line is played from recordings only when every
// sentence in it has one; anything else (a line with the child's name, a
// number, or a pet's name in it) is read by the device voice above.

/** Must match voiceKey() in scripts/record-voice.mjs. */
export function voiceKey(sentence: string): string {
  return sentence.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
}

let clips: Map<string, string> | null = null;
if (typeof window !== 'undefined') {
  fetch('/voice/manifest.json')
    .then(r => (r.ok ? r.json() : {}))
    .then((m: Record<string, string>) => { clips = new Map(Object.entries(m ?? {})); })
    .catch(() => { clips = new Map(); });
}

let player: HTMLAudioElement | null = null;
function stopClip() {
  if (!player) return;
  player.onended = null; player.onerror = null;
  try { player.pause(); } catch { /* ignore */ }
}

/** Play recorded sentences one after another. Returns false if it couldn't start. */
function playClips(files: string[], gen: number, fallback: () => void) {
  player = player ?? new Audio();
  const audio = player;
  let i = 0;
  const next = () => {
    if (gen !== generation) return;
    if (i >= files.length) { setTalking(false); return; }
    audio.src = `/voice/${files[i++]}`;
    audio.onended = () => setTimeout(next, 140); // a small breath between sentences
    audio.onerror = () => { if (gen === generation) fallback(); };
    audio.play().then(() => { if (gen === generation) setTalking(true); })
      .catch(() => { if (gen === generation) fallback(); }); // e.g. autoplay blocked: use the device voice
  };
  next();
}

/**
 * Read a line aloud in Noel's warm voice. Emoji are stripped (they read
 * as "sparkles") and longer lines are spoken a sentence at a time with a
 * tiny breath between, which sounds more like a person and avoids a
 * Chrome bug that cuts long lines off. A new line always replaces the
 * one before, so two lines never talk over each other.
 */
export function say(text: string, opts: SayOptions = {}) {
  if (typeof window === 'undefined') return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const clean = text.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ').trim();
    const gen = ++generation;
    const busy = synth.speaking || synth.pending;
    synth.cancel();
    stopClip();
    setTalking(false);
    if (!clean) return;

    const start = () => {
      if (gen !== generation) return;
      const voice = chosenVoice();
      const natural = isNaturalVoice(voice);
      const wantPitch = opts.pitch ?? 1.08;
      // Lifelike voices already sound warm; pushing their pitch far makes
      // them sound squeaky, so they get half the lift the plain ones get.
      const pitch = natural ? 1 + (wantPitch - 1) * 0.5 : wantPitch;
      const rate = opts.rate ?? 0.92;
      // SHOUTED words ("the SAME color", uppercase headings) get spelled out
      // letter by letter on some voices, so read them as normal words
      const parts = sentences(clean).map(p => p.replace(/\b[A-Z]{2,}\b/g, w => (w === 'GO' || w === 'OK' ? w : w.toLowerCase())));
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        u.rate = rate;
        u.pitch = Math.max(0.5, Math.min(2, pitch));
        u.onstart = () => { if (gen === generation) setTalking(true); };
        if (i === parts.length - 1) {
          const end = () => { if (gen === generation) setTalking(false); };
          u.onend = end; u.onerror = end;
        }
        synth.speak(u);
      });
      // Safari sometimes starts out paused after a cancel
      if (synth.paused) synth.resume();
    };
    // Recorded lines first. A raised pitch means a pet friend is talking
    // (Kiko, Ember...), and they shouldn't borrow Noel's recorded voice.
    if (clips && (opts.pitch ?? 1) < 1.25) {
      const files = sentences(clean).map(p => clips!.get(voiceKey(p)));
      if (files.length && files.every(Boolean)) {
        playClips(files as string[], gen, () => { stopClip(); whenVoicesReady(start); });
        return;
      }
    }

    // Safari drops a line spoken in the same instant as a cancel, so give
    // it a breath when something was still playing.
    const go = () => (busy ? setTimeout(start, 80) : start());
    whenVoicesReady(go);
  } catch { /* reading aloud is a bonus, never an error */ }
}

/**
 * For game bubbles that change often: a short cheer ("Splash!") never
 * cuts Noel off mid-instruction; anything longer replaces what he's saying.
 */
export function sayLine(text: string, opts: SayOptions & { force?: boolean } = {}) {
  const words = text.trim().split(/\s+/).length;
  if (!opts.force && talkingNow && words <= 4) return;
  say(text, opts);
}

export function hush() {
  generation++;
  stopClip();
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  setTalking(false);
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
