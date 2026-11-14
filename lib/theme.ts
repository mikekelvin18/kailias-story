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
  // Bottom tab bar + "← back" pill — solid surfaces so they never get
  // lost against the busy map/sky behind them.
  navBg: string;
  navBorder: string;
  navInactive: string;
  navActive: string;
  navActiveBg: string;
  backBg: string;
  backText: string;
  // Solid content cards (forms, settings, quest cards). At night they're
  // a soft grey-white instead of pure white, so they don't glare
  // against the dark sky.
  surface: string;
}

export const HUB_THEMES: Record<HubThemeName, HubTheme> = {
  bright: {
    name: 'bright',
    // Same sky-to-meadow idea as before, softened to pastels so the
    // background stops competing with the cards and text on top of it
    // (the old lime-green band was the main source of eye strain).
    background: 'linear-gradient(180deg, #C9E8FA 0%, #E3F2FB 35%, #E7F5E1 72%, #CDEBCF 100%)',
    title: 'text-slate-900',
    subtitle: 'text-slate-700',
    badgeText: 'text-amber-800',
    badgeBg: 'rgba(255,255,255,0.75)',
    badgeBorder: 'rgba(217,119,6,0.4)',
    link: 'text-indigo-900 font-semibold',
    panelBg: 'rgba(255,255,255,0.72)',
    panelBorder: 'rgba(30,41,59,0.10)',
    cardBg: 'rgba(255,255,255,0.6)',
    cardBorder: 'rgba(30,41,59,0.1)',
    toggleIcon: '🌙',
    navBg: '#FFFFFF',
    navBorder: 'rgba(15,23,42,0.10)',
    navInactive: '#64748B',
    navActive: '#6D28D9',
    navActiveBg: '#EDE9FE',
    backBg: 'rgba(255,255,255,0.9)',
    backText: '#312E81',
    surface: 'rgba(255,255,255,0.97)',
  },
  dark: {
    name: 'dark',
    // A muted night sky instead of near-black: less glare contrast
    // against white cards, still clearly "night".
    background: 'linear-gradient(180deg, #1A2238 0%, #222849 55%, #1B3A35 100%)',
    title: 'text-slate-50',
    subtitle: 'text-slate-300',
    badgeText: 'text-yellow-300',
    badgeBg: 'rgba(255,255,255,0.1)',
    badgeBorder: 'rgba(253,224,71,0.4)',
    link: 'text-indigo-200',
    panelBg: 'rgba(255,255,255,0.09)',
    panelBorder: 'rgba(255,255,255,0.14)',
    cardBg: 'rgba(255,255,255,0.07)',
    cardBorder: 'rgba(255,255,255,0.12)',
    toggleIcon: '☀️',
    navBg: '#1E2438',
    navBorder: 'rgba(255,255,255,0.10)',
    navInactive: '#A5B0C6',
    navActive: '#C4B5FD',
    navActiveBg: 'rgba(167,139,250,0.18)',
    backBg: 'rgba(255,255,255,0.12)',
    backText: '#E0E7FF',
    surface: '#E6E9F2',
  },
};

const KEY = 'kailia_hub_theme_v1';

// Every hub page (and the standalone ThemeToggle button) calls useHubTheme()
// independently — plain useState alone means toggling in one component
// doesn't tell any other instance. This event lets every instance stay
// in sync, the same pattern lib/family.ts uses for active-child changes.
export const HUB_THEME_CHANGED_EVENT = 'kailia-hub-theme-changed';

export function loadHubTheme(): HubThemeName {
  if (typeof window === 'undefined') return 'bright';
  const saved = localStorage.getItem(KEY);
  return saved === 'dark' ? 'dark' : 'bright';
}

export function saveHubTheme(name: HubThemeName) {
  try {
    localStorage.setItem(KEY, name);
    window.dispatchEvent(new Event(HUB_THEME_CHANGED_EVENT));
  } catch { /* ignore */ }
}
