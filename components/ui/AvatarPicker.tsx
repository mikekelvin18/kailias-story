'use client';

// ── Avatar Picker ──
// Six buddies, laid out 3 × 2 on phones and in one row on wider screens,
// so the set always reads as a balanced block. The chosen one gets a
// clear ring and a check; the others stay calm.

import ChildAvatar from '@/components/characters/ChildAvatar';
import { CHILD_AVATARS } from '@/components/characters/characters.config';

export default function AvatarPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Pick an avatar" className="grid grid-cols-3 sm:grid-cols-6 gap-x-2 gap-y-4 py-1">
      {CHILD_AVATARS.map(a => {
        const on = value === a.id;
        return (
          <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(a.id)}
            className="group flex flex-col items-center gap-2 focus:outline-none">
            <span className="relative flex rounded-full transition-all duration-200 group-active:scale-95"
              style={{
                boxShadow: on ? '0 0 0 3px #fff, 0 0 0 6px #2563EB, 0 8px 18px rgba(37,99,235,0.25)' : '0 0 0 1px rgba(15,23,42,0.06)',
                transform: on ? 'scale(1.04)' : undefined,
              }}>
              <span className="flex sm:hidden"><ChildAvatar avatar={a.id} size={76} /></span>
              <span className="hidden sm:flex"><ChildAvatar avatar={a.id} size={80} /></span>
              {on && (
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#2563EB', boxShadow: '0 0 0 2.5px #fff' }}>
                  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </span>
            <span className={`text-xs font-extrabold ${on ? 'text-blue-600' : 'text-slate-500'}`}>{a.name}</span>
          </button>
        );
      })}
    </div>
  );
}
