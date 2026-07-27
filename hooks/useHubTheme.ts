import { useEffect, useState } from 'react';
import { HUB_THEMES, HubThemeName, HUB_THEME_CHANGED_EVENT, loadHubTheme, saveHubTheme } from '@/lib/theme';

// One shared bright/dark decision for every hub screen (world map, quest
// library, printables, family) instead of each picking its own colors.
// Every caller of this hook gets its OWN useState, so a toggle from one
// instance (e.g. the standalone ThemeToggle button) has to notify the
// others via HUB_THEME_CHANGED_EVENT or their `theme` would go stale.
export function useHubTheme() {
  const [name, setName] = useState<HubThemeName>('bright');

  useEffect(() => {
    const load = () => setName(loadHubTheme());
    load();
    window.addEventListener(HUB_THEME_CHANGED_EVENT, load);
    return () => window.removeEventListener(HUB_THEME_CHANGED_EVENT, load);
  }, []);

  function toggle() {
    // saveHubTheme dispatches HUB_THEME_CHANGED_EVENT, which synchronously
    // calls setName on every OTHER mounted instance of this hook. Doing
    // that from inside a setState updater (the previous version) counts
    // as updating another component while this one is still rendering,
    // which React rejects — so compute `next` plainly first, then call
    // saveHubTheme and setName as ordinary statements in the event handler.
    const next: HubThemeName = name === 'bright' ? 'dark' : 'bright';
    saveHubTheme(next);
    setName(next);
  }

  return { theme: HUB_THEMES[name], name, toggle };
}
