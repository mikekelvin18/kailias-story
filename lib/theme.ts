// ── Shared hub theme ──
// One bright/dark decision, one place — instead of every hub screen
// (world map, quest library, printables, family) picking its own colors
// ad hoc. Individual mini-games keep their own biome-specific palettes
// (Firefly Forest's night sky, Dragon's Cave's embers, etc.) — those are
// intentional per-game identity, not chrome, so they're untouched by
// this. This only covers the four shared "hub" screens plus the bottom
// nav that ties them together.
//
// A device display preference, not child data — saved locally, no
// consent-gating, not in CHILD_DATA_KEYS.

export type HubThemeName = 'bright' | 'dark';

export interface HubTheme {
  name: HubThemeName;
  background: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  link: string;
  panelBg: string;
  panelBorder: string;
  cardBg: string;
  cardBorder: string;
  toggleIcon: string; // icon shown for switching TO the other theme
}

export const HUB_THEMES: Record<HubThemeName, HubTheme> = {
  bright: {
    name: 'bright',
    background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 30%, #bef264 70%, #86efac 100%)',
    title: 'text-indigo-950',
    subtitle: 'text-indigo-900',
    badgeText: 'text-amber-800',
    badgeBg: 'rgba(255,255,255,0.75)',
    badgeBorder: 'rgba(217,119,6,0.4)',
    link: 'text-indigo-900 font-semibold',
    panelBg: 'rgba(255,255,255,0.55)',
    panelBorder: 'rgba(30,41,59,0.12)',
    cardBg: 'rgba(255,255,255,0.4)',
    cardBorder: 'rgba(30,41,59,0.1)',
    toggleIcon: '🌙',
  },
  dark: {
    name: 'dark',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 55%, #0f3d2e 100%)',
    title: 'text-white drop-shadow-lg',
    subtitle: 'text-purple-200',
    badgeText: 'text-yellow-300',
    badgeBg: 'rgba(255,255,255,0.1)',
    badgeBorder: 'rgba(253,224,71,0.4)',
    link: 'text-purple-300',
    panelBg: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(255,255,255,0.15)',
    cardBg: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.12)',
    toggleIcon: '☀️',
  },
};

const KEY = 'kailia_hub_theme_v1';

export function loadHubTheme(): HubThemeName {
  if (typeof window === 'undefined') return 'bright';
  const saved = localStorage.getItem(KEY);
  return saved === 'dark' ? 'dark' : 'bright';
}

export function saveHubTheme(name: HubThemeName) {
  try { localStorage.setItem(KEY, name); } catch { /* ignore */ }
}
