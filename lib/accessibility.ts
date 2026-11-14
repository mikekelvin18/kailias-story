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
  /** Soft background music in the games. */
  musicOn: boolean;
  /** A grown-up's hand-picked read-aloud voice ('' = pick the nicest automatically). */
  voiceName: string;
}

export const DEFAULT_A11Y: AccessibilityPrefs = {
  reducedMotion: false,
  reducedSound: false,
  textSize: 'normal',
  dyslexiaFriendly: false,
  colorblindSafe: false,
  musicOn: true,
  voiceName: '',
};

const KEY = 'kailia_a11y_v1';

export function loadA11y(): AccessibilityPrefs {
  if (typeof window === 'undefined') return DEFAULT_A11Y;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_A11Y, ...JSON.parse(raw) } : DEFAULT_A11Y;
  } catch { return DEFAULT_A11Y; }
}

export function saveA11y(prefs: AccessibilityPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(A11Y_EVENT)); } catch { /* ignore */ }
}

// Applies prefs as attributes on <html> so plain CSS (globals.css) can
// react to them everywhere, without every component needing to read
// the settings itself.
export function applyA11y(prefs: AccessibilityPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.reducedMotion = String(prefs.reducedMotion);
  root.dataset.textSize = prefs.textSize;
  root.dataset.dyslexiaFriendly = String(prefs.dyslexiaFriendly);
  root.dataset.colorblindSafe = String(prefs.colorblindSafe);
}

// Games check this before playing any sound effect.
export function soundEnabled(): boolean {
  return !loadA11y().reducedSound;
}

// Background music plays only when music is on AND sound isn't turned down.
export function musicEnabled(): boolean {
  const a = loadA11y();
  return a.musicOn && !a.reducedSound;
}

// Other parts of the app (the music player) listen for changes made anywhere.
export const A11Y_EVENT = 'kailia-a11y-change';
export function updateA11yPrefs(patch: Partial<AccessibilityPrefs>): AccessibilityPrefs {
  const next = { ...loadA11y(), ...patch };
  saveA11y(next);
  applyA11y(next);
  return next;
}
