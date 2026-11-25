'use client';
// ── Family page: "Game level" and "Big Kid look" for one child ──
// Grok's review (2026-11-25). Let the app adjust (recommended) / Easier /
// Harder moves every game's age band and starting level a year down or up
// (lib/ageBands.ts). The Big Kid look is fewer sparkles, smaller characters
// and a plainer adventure style, for children who find the games babyish.

import { useState } from 'react';
import { setChildGamePrefs, type ChildProfile } from '@/lib/family';
import { bandSettings, type GameLevelChoice } from '@/lib/ageBands';

const CHOICES: { id: GameLevelChoice; label: string; note: string }[] = [
  { id: 'auto', label: 'Let the app adjust', note: 'Recommended. Games start at the right level and step up or back as your child plays.' },
  { id: 'easier', label: 'Easier', note: 'Every game starts about a year easier.' },
  { id: 'harder', label: 'Harder', note: 'Every game starts about a year harder.' },
];

export default function GameLevelSettings({ child, ageMonths }: { child: ChildProfile; ageMonths: number | null }) {
  const [level, setLevel] = useState<GameLevelChoice>(child.gameLevel ?? 'auto');
  const suggested = bandSettings(ageMonths).bigKidLook;
  const [bigKid, setBigKid] = useState<boolean>(child.bigKidLook ?? false);

  function pick(id: GameLevelChoice) {
    setLevel(id);
    setChildGamePrefs(child.id, { gameLevel: id });
  }
  function toggleBigKid(on: boolean) {
    setBigKid(on);
    setChildGamePrefs(child.id, { bigKidLook: on });
  }

  return (
    <div data-game-level-settings>
      <h2 className="text-lg font-extrabold text-gray-800">Game level</h2>
      <p className="text-sm text-gray-500 mb-2">How hard {child.nickname}&apos;s games start.</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Game level">
        {CHOICES.map(c => (
          <button key={c.id} role="radio" aria-checked={level === c.id} onClick={() => pick(c.id)}
            className="text-left rounded-xl p-3 min-h-[48px]"
            style={{ background: level === c.id ? '#EDE9FE' : '#F1F5F9', border: level === c.id ? '2px solid #7C3AED' : '2px solid transparent' }}>
            <span className="block text-sm font-extrabold text-gray-800">{c.label}</span>
            <span className="block text-xs text-gray-500">{c.note}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-2 rounded-xl p-3 min-h-[48px] mt-3 cursor-pointer" style={{ background: '#F1F5F9' }}>
        <span className="text-sm font-semibold text-gray-700">Big Kid look
          <span className="block text-xs font-normal text-gray-500">
            Fewer sparkles, smaller characters and a plainer adventure style.{suggested ? ` Good for ${child.nickname}'s age.` : ''}
          </span>
        </span>
        <input type="checkbox" checked={bigKid} onChange={e => toggleBigKid(e.target.checked)} className="w-5 h-5 shrink-0" />
      </label>
    </div>
  );
}
