import { useEffect, useState } from 'react';
import { HUB_THEMES, HubThemeName, loadHubTheme, saveHubTheme } from '@/lib/theme';

// One shared bright/dark decision for every hub screen (world map, quest
// library, printables, family) instead of each picking its own colors.
export function useHubTheme() {
  const [name, setName] = useState<HubThemeName>('bright');

  useEffect(() => { setName(loadHubTheme()); }, []);

  function toggle() {
    setName(prev => {
      const next: HubThemeName = prev === 'bright' ? 'dark' : 'bright';
      saveHubTheme(next);
      return next;
    });
  }

  return { theme: HUB_THEMES[name], name, toggle };
}
