// ── Come back here after a game ──
// Every game's "back" link goes to the world map (/play). When a game is
// started from somewhere else, such as a friend's trail, that screen
// leaves a note here and the map sends the child straight back to it.
// Holds only a route inside the app (no child data), lives in
// sessionStorage for this tab, and goes stale after 30 minutes.

const KEY = 'kailia_return_v1';
const MAX_AGE_MS = 30 * 60 * 1000;

export function setReturnPath(path: string) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })); } catch { /* ignore */ }
}

export function clearReturnPath() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** The pending return route (and clears it), or null. */
export function takeReturnPath(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw);
    if (typeof path !== 'string' || !path.startsWith('/') || Date.now() - at > MAX_AGE_MS) return null;
    return path;
  } catch { return null; }
}
