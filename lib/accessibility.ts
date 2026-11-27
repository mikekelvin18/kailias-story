// ── Accessibility preferences ──
// Device display settings (motion, sound, text size, reading support,
// colorblind-safe accents) — NOT child data. These describe how this
// device renders the app, not anything about the child, so they're
// saved locally without consent-gating and are NOT in CHILD_DATA_KEYS.

export interface AccessibilityPrefs {
  reducedMotion: boolean;
  reducedSound: boolean;
  textSize: 'normal' | 'large' | 'xlarge';
  dyslexiaFriendly: boolean;
  colorblindSafe: boolean;
  /** Calm mode: plain game backgrounds, no pulsing, glows or sparkles, slower
   *  and fewer moving decorations (the targets still move). The grown-ups'
   *  Display settings and the moon button on the map switch it. */
  calmMode: boolean;
  /** Soft background music in the games. */
  musicOn: boolean;
  /** A grown-up's hand-picked read-aloud voice ('' = pick the nicest automatically). */
  voiceName: string;
  /** Overall volume for voices, music and sound effects, 0–1 (Parent Zone slider). */
  volume: number;
  /** Read stories, instructions and speech bubbles aloud (Parent Zone on/off). */
  narrationOn: boolean;
  /** How fast the voices read: 0.8 (slower), 1 or 1.2 (quicker). */
  narrationSpeed: number;
  // ── Grown-ups' sensory and play settings (Parent Zone > "Senses, talking & breaks") ──
  /** Loudness of Noel's, Kailia's and the friends' voices, 0–1. */
  voiceVolume: number;
  /** Loudness of the little game sounds (taps, chimes, cheers), 0–1. */
  effectsVolume: number;
  /** Loudness of the soft background music, 0–1. */
  musicVolume: number;
  /** Gentle sounds: sharp sound effects are rounded off and celebrations play quieter. */
  gentleSounds: boolean;
  /** Low visual: everything Calm mode does, plus no confetti (one still star
   *  instead) and fewer things hiding in busy scenes. */
  lowVisual: boolean;
  /** A tiny buzz on a right tap, on phones that can vibrate. */
  haptics: boolean;
  /** "Your turn to talk" pauses in the story and talking games. */
  talkPauses: boolean;
  /** How long Kailia waits for the child to talk, in seconds (3, 5 or 8). */
  talkWait: number;
  /** Break reminder after this many minutes of play: 'auto' (15 under 5, else 20), or 0 = off. */
  breakMinutes: 'auto' | 0 | 10 | 15 | 20;
  /** "Done for today" after this many minutes of play in a day (0 = off). */
  dailyMinutes: number;
}

export const DEFAULT_A11Y: AccessibilityPrefs = {
  reducedMotion: false,
  reducedSound: false,
  textSize: 'normal',
  dyslexiaFriendly: false,
  colorblindSafe: false,
  calmMode: false,
  musicOn: true,
  voiceName: '',
  volume: 1,
  narrationOn: true,
  narrationSpeed: 1,
  voiceVolume: 1,
  effectsVolume: 1,
  musicVolume: 1,
  gentleSounds: false,
  lowVisual: false,
  haptics: true,
  talkPauses: true,
  talkWait: 5,
  breakMinutes: 'auto',
  dailyMinutes: 0,
};

export const TALK_WAITS = [3, 5, 8] as const;
export const BREAK_CHOICES = [0, 10, 15, 20] as const;
export const DAILY_CHOICES = [0, 20, 30, 45, 60] as const;
const unit = (v: unknown, fallback = 1) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback; };

export const NARRATION_SPEEDS = [0.8, 1, 1.2] as const;
/** Read-aloud speed, always one of NARRATION_SPEEDS. */
export function narrationSpeed(): number {
  const s = Number(loadA11y().narrationSpeed);
  return (NARRATION_SPEEDS as readonly number[]).includes(s) ? s : 1;
}
export function narrationOn(): boolean { return loadA11y().narrationOn !== false; }

const KEY = 'kailia_a11y_v1';

// One fresh start for sound (2026-11-21): earlier builds had a volume
// slider and a separate music switch, and some devices were left half
// muted. Everyone starts with sound on once; after that only the sound
// button turns it off.
const SOUND_RESET_KEY = 'kailia_sound_reset_v3'; // v3: also undo mutes the old sound button saved for good
function soundFreshStart(prefs: AccessibilityPrefs): AccessibilityPrefs {
  try {
    if (localStorage.getItem(SOUND_RESET_KEY)) return prefs;
    localStorage.setItem(SOUND_RESET_KEY, '1');
    const next = { ...prefs, reducedSound: false, musicOn: true, volume: 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch { return prefs; }
}

export function loadA11y(): AccessibilityPrefs {
  if (typeof window === 'undefined') return DEFAULT_A11Y;
  try {
    const raw = localStorage.getItem(KEY);
    return soundFreshStart(raw ? { ...DEFAULT_A11Y, ...JSON.parse(raw) } : DEFAULT_A11Y);
  } catch { return DEFAULT_A11Y; }
}

export function saveA11y(prefs: AccessibilityPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(A11Y_EVENT)); } catch { /* ignore */ }
}

// Applies prefs as attributes on <html> so plain CSS (globals.css) can
// react to them everywhere, without every component needing to read
// the settings itself.
/** The phone or computer itself asks for less motion (its accessibility settings). */
export function deviceWantsLessMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** The phone or computer itself asks for more contrast. */
export function deviceWantsMoreContrast(): boolean {
  try { return window.matchMedia('(prefers-contrast: more)').matches; } catch { return false; }
}

export function applyA11y(prefs: AccessibilityPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // Low visual includes every Calm mode rule (one stiller look, not two
  // competing ones), and adds its own on top (data-low-visual).
  root.dataset.lowVisual = String(!!prefs.lowVisual);
  root.dataset.contrast = deviceWantsMoreContrast() ? 'more' : 'normal';
  // the device's own "reduce motion" counts too, without anyone having to
  // find the switch in the Parent Zone
  root.dataset.reducedMotion = String(prefs.reducedMotion || deviceWantsLessMotion());
  root.dataset.textSize = prefs.textSize;
  root.dataset.dyslexiaFriendly = String(prefs.dyslexiaFriendly);
  root.dataset.colorblindSafe = String(prefs.colorblindSafe);
  root.dataset.calm = String(prefs.calmMode || !!prefs.lowVisual);
}

// Games check this before playing any sound effect.
// The sound button's "off" lasts only until the app is opened again
// (Kelvin, 2026-11-22: "the music is off again when I opened the app";
// he wants sound on every time, with a button to turn it off). It lives
// in memory, so every fresh open starts with sound on. Only the grown-ups'
// "Sound off" setting in the Parent Zone stays off for good.
let mutedNow = false;
export function isMutedNow() { return mutedNow; }
export function setMutedNow(m: boolean) {
  mutedNow = m;
  try { window.dispatchEvent(new Event(A11Y_EVENT)); } catch { /* ignore */ }
}

export function soundEnabled(): boolean {
  return !mutedNow && !loadA11y().reducedSound;
}

// How loud the app's own sounds are: full, or off. Kelvin (2026-11-21):
// "just have a button to turn it off, then the volume just on the phone or
// computer, usual volume", so there's no in-app volume any more; the
// device's own volume buttons set how loud it is.
export function masterVolume(): number {
  return mutedNow || loadA11y().reducedSound ? 0 : 1;
}

// ── One slider each for voices, sound effects and music ──
// Each is the grown-ups' slider times the on/off above, so "Sound off" and
// the sound button still silence everything.
export function voiceVolume(): number { return masterVolume() * unit(loadA11y().voiceVolume); }
export function effectsVolume(): number {
  const a = loadA11y();
  return masterVolume() * unit(a.effectsVolume) * (a.gentleSounds ? 0.6 : 1);
}
export function musicVolume(): number {
  const a = loadA11y();
  return masterVolume() * unit(a.musicVolume) * (a.gentleSounds ? 0.8 : 1);
}
export function gentleSounds(): boolean { return !!loadA11y().gentleSounds; }
/** Low visual (grown-ups' setting): no confetti, fewer moving things. */
export function lowVisual(): boolean { return !!loadA11y().lowVisual; }

// Background music plays only when music is on AND sound isn't turned down.
export function musicEnabled(): boolean {
  const a = loadA11y();
  return !mutedNow && a.musicOn && !a.reducedSound && unit(a.musicVolume) > 0;
}

// Other parts of the app (the music player) listen for changes made anywhere.
export const A11Y_EVENT = 'kailia-a11y-change';
export function updateA11yPrefs(patch: Partial<AccessibilityPrefs>): AccessibilityPrefs {
  const next = { ...loadA11y(), ...patch };
  saveA11y(next);
  applyA11y(next);
  return next;
}
