'use client';

import { useState } from 'react';
import { SKILL_INFO } from '@/lib/skillInfo';

// A small collapsible "For grown-ups" note on every game's intro screen:
// which skills the game targets and what the app quietly notices.
// Collapsed by default so child-facing screens stay clean and story-first.

export default function SkillIntro({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);
  const info = SKILL_INFO[gameId];
  if (!info) return null;

  return (
    <div className="mt-4 mx-2 text-left rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold"
        style={{ color: 'rgba(255,255,255,0.85)' }}>
        <span>👨‍👩‍👧 For grown-ups: what this game builds</span>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 slide-up">
          <div className="flex gap-1.5 flex-wrap mb-2">
            {info.skills.map(s => (
              <span key={s} className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(255,255,255,0.9)', color: '#312E81' }}>{s}</span>
            ))}
          </div>
          <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.95)' }}>
            <strong>Builds:</strong> {info.builds}
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <strong>We quietly notice:</strong> {info.notices} Nothing here is ever shown to your
            child as a score.
          </p>
        </div>
      )}
    </div>
  );
}
