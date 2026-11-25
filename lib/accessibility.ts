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
};

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

export function applyA11y(prefs: AccessibilityPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // the device's own "reduce motion" counts too, without anyone having to
  // find the switch in the Parent Zone
  root.dataset.reducedMotion = String(prefs.reducedMotion || deviceWantsLessMotion());
  root.dataset.textSize = prefs.textSize;
  root.dataset.dyslexiaFriendly = String(prefs.dyslexiaFriendly);
  root.dataset.colorblindSafe = String(prefs.colorblindSafe);
  root.dataset.calm = String(prefs.calmMode);
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

// Background music plays only when music is on AND sound isn't turned down.
export function musicEnabled(): boolean {
  const a = loadA11y();
  return !mutedNow && a.musicOn && !a.reducedSound;
}

// Other parts of the app (the music player) listen for changes made anywhere.
export const A11Y_EVENT = 'kailia-a11y-change';
export function updateA11yPrefs(patch: Partial<AccessibilityPrefs>): AccessibilityPrefs {
  const next = { ...loadA11y(), ...patch };
  saveA11y(next);
  applyA11y(next);
  return next;
}
