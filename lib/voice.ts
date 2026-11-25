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

import { loadA11y, masterVolume, narrationOn, narrationSpeed } from './accessibility';
import { deviceNames } from './nameSounds';

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
  // Privacy (COPPA): online voices (Edge "Online (Natural)", Chrome's
  // "Google …" voices) send the spoken text to a cloud service, and some
  // lines say the child's nickname. Only voices that run on the device
  // itself may speak (2026-11-25, kids'-store rules check).
  if (!v.localService) return -60;
  let s = 0;
  const fav = FAVOURITES.findIndex(f => name.includes(f));
  if (fav >= 0) s += 200 - fav * 3;
  if (NATURAL.test(v.name)) s += 60;
  if (lang === 'en-us') s += 15;
  else if (lang === 'en-gb' || lang === 'en-au' || lang === 'en-ca') s += 8;
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
    if (v && v.localService) return v;
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
  /** who is talking: a pet friend's name ("Shelly"). Omitted = Noel. */
  voice?: string;
  /**
   * who asked for the line ("read-aloud" = NoelVoice reading a card). Lets a
   * reader stop only its own line: closing the story card must not cut off
   * the line the game itself just started ("The baby dragons are hungry…").
   */
  owner?: string;
  /** called as each sentence starts (its number in splitSentences(text)), for the reading highlight */
  onSentence?: (index: number) => void;
  /** called once the whole line has been read (not when it was cut off by a newer line) */
  onDone?: () => void;
}

// ── Pause and play (the narration player's big button) ──
let pausedNow = false;
const pauseListeners = new Set<(paused: boolean) => void>();
function setPaused(p: boolean) {
  if (pausedNow === p) return;
  pausedNow = p;
  pauseListeners.forEach(fn => { try { fn(p); } catch { /* ignore */ } });
}
export function onPaused(fn: (paused: boolean) => void) { pauseListeners.add(fn); return () => { pauseListeners.delete(fn); }; }
export function voicePaused() { return pausedNow; }
/** Pause whatever is being read, mid-sentence. */
export function pauseVoice() {
  if (!talkingNow) return;
  try { if (player && !player.paused) player.pause(); } catch { /* ignore */ }
  try { window.speechSynthesis?.pause(); } catch { /* ignore */ }
  setPaused(true);
}
/** Carry on from where it was paused. */
export function resumeVoice() {
  if (!pausedNow) return;
  setPaused(false);
  try { if (player && player.paused && player.src && player.src !== SILENCE) void player.play().catch(() => {}); } catch { /* ignore */ }
  try { window.speechSynthesis?.resume(); } catch { /* ignore */ }
}

// ── The pet friends' own voices ──
// Each friend speaks with its own recorded voice (girls sound like girls,
// boys like boys), made the same way as Noel's by scripts/record-voice.py
// --speaker <name>, into public/voice/pets/<name>/. A friend never borrows
// Noel's voice: a sentence it has no recording for is read by the device
// voice at the friend's pitch.
export const PET_VOICES: Record<string, { girl: boolean; pitch: number }> = {
  shelly: { girl: true, pitch: 1.3 },
  nova: { girl: true, pitch: 1.35 },
  kiko: { girl: true, pitch: 1.4 },
  flick: { girl: false, pitch: 1.2 },
  sage: { girl: false, pitch: 1.05 },
  ember: { girl: false, pitch: 1.25 },
};

const petClips = new Map<string, Map<string, string> | Promise<Map<string, string>>>();
function petManifest(name: string): Map<string, string> | Promise<Map<string, string>> {
  let m = petClips.get(name);
  if (!m) {
    m = fetch(`/voice/pets/${name}/manifest.json`)
      .then(r => (r.ok ? r.json() : {}))
      .then((j: Record<string, string>) => { const map = new Map(Object.entries(j ?? {})); petClips.set(name, map); return map; })
      .catch(() => { const map = new Map<string, string>(); petClips.set(name, map); return map; });
    petClips.set(name, m);
  }
  return m;
}
/** Start loading a friend's recordings early (e.g. when its pop-up opens). */
export function warmVoice(voice: string) {
  const name = voice.toLowerCase();
  if (typeof window !== 'undefined' && PET_VOICES[name]) void petManifest(name);
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
export function splitSentences(text: string): string[] { return sentences(text); }
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

// ── Voices made by scripts/generate_voices.py ──
// public/audio/manifest.json lists every pre-made clip by speaker:
// { "kailia": { "<voiceKey of the sentence>": "kailia/hi-im-kailia-1a2b3c4d.mp3" } }.
// Kailia speaks only from these; a sentence with no clip yet is read by the
// device voice, a little higher and quicker, until her clips are made.
let audioClips: Record<string, Record<string, string>> | null = null;
if (typeof window !== 'undefined') {
  fetch('/audio/manifest.json')
    .then(r => (r.ok ? r.json() : {}))
    .then((m: Record<string, Record<string, string>>) => { audioClips = m ?? {}; })
    .catch(() => { audioClips = {}; });
}
/** Device-voice pitch for Kailia when she has no clip for a sentence. */
const KAILIA_PITCH = 1.45;

let player: HTMLAudioElement | null = null;

// ── Waking sound up on the first tap ──
// Phones (iPhone Safari above all) refuse to play any sound until the
// person has tapped the page, and a line asked for before that is simply
// dropped. So a line that couldn't play yet is kept here, and the first tap
// anywhere (components/SoundStart.tsx calls unlockVoice) plays it then.
let unlocked = false;
let waiting: { text: string; opts: SayOptions; at: number } | null = null;

/** True when the browser will let us play sound now. */
function soundAllowed() {
  if (unlocked) return true;
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return ua ? ua.hasBeenActive : true; // no way to tell: try, and keep the line if it's refused
}

/** A tenth of a second of silence, to wake the audio player inside a tap. */
const SILENCE = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA';

/** True once a sound has really played: the phone has let us in. */
let primed = false;

/** True once the phone has let the player make sound (SoundStart stops trying then). */
export function voiceReady() { return primed; }

/**
 * Call from inside a tap (touchend / click / key: on iPhones a finger
 * going DOWN doesn't count, only lifting it). Lets the player and the
 * device voice make sound from now on, and plays the line that was
 * waiting for this tap. Safe to call on every tap until voiceReady().
 */
export function unlockVoice() {
  if (typeof window === 'undefined' || primed) return;
  unlocked = true;
  const w = waiting && Date.now() - waiting.at < 60_000 ? waiting : null; // a line from long ago is no longer on screen
  waiting = null;
  try {
    const synth = window.speechSynthesis;
    if (synth && !synth.speaking && !synth.pending) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
  } catch { /* ignore */ }
  // the waiting line plays right here, inside the tap, which is what wakes the player
  if (w && !w.opts.owner) { say(w.text, w.opts); return; }
  // a story card's line: the tap may be "Play", which closes the card. Wake the
  // player with silence now and read the card a moment later only if it is
  // still open, so the child never hears two words and a cut.
  if (w) {
    replay = w;
    setTimeout(() => { if (replay === w) { replay = null; say(w.text, w.opts); } }, 260);
  }
  try {
    // only when nothing is playing: a silent clip must never cut Noel off
    player = player ?? new Audio();
    if (player.paused) {
      player.onended = null; player.onerror = null;
      player.src = SILENCE;
      player.volume = 0;
      player.play().then(() => { primed = true; }).catch(() => {});
    }
  } catch { /* ignore */ }
}

function stopClip() {
  if (!player) return;
  player.onended = null; player.onerror = null;
  if (player.src === SILENCE) return; // the wake-up clip is silent; let it finish waking the player
  try { player.pause(); } catch { /* ignore */ }
}

/** Play recorded sentences one after another. Returns false if it couldn't start. */
function playClips(files: string[], gen: number, fallback: () => void, base = '/voice', hooks: SayOptions = {}) {
  player = player ?? new Audio();
  const audio = player;
  let i = 0;
  const next = () => {
    if (gen !== generation) return;
    if (i >= files.length) { setTalking(false); hooks.onDone?.(); return; }
    hooks.onSentence?.(i);
    audio.src = `${base}/${files[i++]}`;
    audio.playbackRate = narrationSpeed();
    audio.dataset.owner = lineOwner ?? ''; // whose line this is (scripts/voice-check.mjs reads it)
    audio.volume = masterVolume();
    audio.onended = () => setTimeout(next, 140); // a small breath between sentences
    audio.onerror = () => { if (gen === generation) fallback(); };
    audio.play().then(() => { primed = true; if (gen === generation) setTalking(true); })
      .catch((e: unknown) => {
        if (gen !== generation) return;
        // sound not allowed yet: keep the line for the first tap instead of losing it
        if (!primed && (e as { name?: string })?.name === 'NotAllowedError' && lastLine) { waiting = { ...lastLine, at: Date.now() }; return; }
        fallback(); // anything else: use the device voice
      });
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
let lastLine: { text: string; opts: SayOptions } | null = null;
let lineOwner: string | null = null;
/** a story card's line waiting to be read just after the first tap (see unlockVoice) */
let replay: { text: string; opts: SayOptions } | null = null;

export function say(text: string, opts: SayOptions = {}) {
  if (typeof window === 'undefined') return;
  // grown-ups can switch read-aloud off (Parent Zone): nothing is spoken
  if (!narrationOn()) { generation++; stopClip(); try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } setTalking(false); return; }
  setPaused(false);
  lastLine = { text, opts };
  lineOwner = opts.owner ?? null;
  replay = null;
  try {
    // Recorded lines must play even where the browser has no speech
    // engine or no voices at all (Muse's test browser said "This device
    // has no read-aloud voices" and Noel stayed silent).
    const synth: SpeechSynthesis | undefined = window.speechSynthesis;
    const clean = text.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ').trim();
    const gen = ++generation;
    const busy = !!synth && (synth.speaking || synth.pending);
    try { synth?.cancel(); } catch { /* ignore */ }
    stopClip();
    setTalking(false);
    if (!clean) return;
    // no tap yet: nothing can play, so this line waits for the first tap
    if (!soundAllowed()) { waiting = { text, opts, at: Date.now() }; return; }
    waiting = null;

    const start = () => {
      if (gen !== generation || !synth) return;
      // No voices at all: queuing lines there can pile up and play late
      // over the next game (Muse retest #3, Sense Explorer), so don't.
      if (synth.getVoices().length === 0) return;
      const voice = chosenVoice();
      // no on-device voice: stay quiet rather than fall back to an online one
      if (!voice) { if (gen === generation) { setTalking(false); opts.onDone?.(); } return; }
      const natural = isNaturalVoice(voice);
      const wantPitch = opts.pitch ?? 1.08;
      // Lifelike voices already sound warm; pushing their pitch far makes
      // them sound squeaky, so they get half the lift the plain ones get.
      const pitch = natural ? 1 + (wantPitch - 1) * 0.5 : wantPitch;
      const rate = (opts.rate ?? 0.92) * narrationSpeed();
      // SHOUTED words ("the SAME color", uppercase headings) get spelled out
      // letter by letter on some voices, so read them as normal words
      const parts = sentences(clean).map(p => deviceNames(p.replace(/\b[A-Z]{2,}\b/g, w => (w === 'GO' || w === 'OK' ? w : w.toLowerCase()))));
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.volume = masterVolume();
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        u.rate = rate;
        u.pitch = Math.max(0.5, Math.min(2, pitch));
        u.onstart = () => { if (gen === generation) { setTalking(true); opts.onSentence?.(i); } };
        if (i === parts.length - 1) {
          const end = () => { if (gen === generation) { setTalking(false); opts.onDone?.(); } };
          u.onend = end; u.onerror = end;
        }
        synth.speak(u);
      });
      // Safari sometimes starts out paused after a cancel
      if (synth.paused) synth.resume();
    };
    // Kailia: her own made-ahead clips, else the device voice in a higher, kid pitch.
    const who = opts.voice ? opts.voice.toLowerCase() : null;
    if (who === 'kailia') {
      const mine = audioClips?.kailia ?? {};
      const files = sentences(clean).map(p => mine[voiceKey(p)]);
      opts = { ...opts, pitch: opts.pitch ?? KAILIA_PITCH, rate: opts.rate ?? 1 };
      if (files.length && files.every(Boolean)) {
        playClips(files as string[], gen, () => { stopClip(); whenVoicesReady(start); }, '/audio', opts);
      } else {
        whenVoicesReady(busy ? () => setTimeout(start, 80) : start);
      }
      return;
    }
    // A pet friend talking: its own recordings, never Noel's.
    const pet = who;
    if (pet && PET_VOICES[pet]) {
      const devicePitch = () => { opts = { ...opts, pitch: opts.pitch ?? PET_VOICES[pet].pitch }; };
      const tryClips = (m: Map<string, string>) => {
        if (gen !== generation) return;
        const files = sentences(clean).map(p => m.get(voiceKey(p)));
        if (files.length && files.every(Boolean)) {
          playClips(files as string[], gen, () => { stopClip(); devicePitch(); whenVoicesReady(start); }, `/voice/pets/${pet}`, opts);
        } else { devicePitch(); whenVoicesReady(busy ? () => setTimeout(start, 80) : start); }
      };
      const m = petManifest(pet);
      if (m instanceof Map) tryClips(m); else void m.then(tryClips);
      return;
    }

    // Recorded lines first. A raised pitch means someone other than Noel is
    // talking, and they shouldn't borrow Noel's recorded voice.
    if (clips && (opts.pitch ?? 1) < 1.25) {
      const files = sentences(clean).map(p => clips!.get(voiceKey(p)));
      if (files.length && files.every(Boolean)) {
        playClips(files as string[], gen, () => { stopClip(); whenVoicesReady(start); }, '/voice', opts);
        return;
      }
      // No device voice to fill the gaps: play the sentences that are
      // recorded rather than say nothing at all.
      const recorded = files.filter(Boolean) as string[];
      if (recorded.length && (!synth || allVoices().length === 0)) {
        playClips(recorded, gen, () => stopClip());
        return;
      }
    }
    if (!synth) return;

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

/** Stop the current line only if `owner` started it (a newer line from a game keeps playing). */
export function hushOwn(owner: string) {
  if (lineOwner === owner) hush();
}

export function hush() {
  generation++;
  setPaused(false);
  waiting = null;
  replay = null;
  stopClip();
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  setTalking(false);
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
