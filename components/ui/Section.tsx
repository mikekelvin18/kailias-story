'use client';

import { useHubTheme } from '@/hooks/useHubTheme';

// A closed-by-default, clearly labelled section: one row with an icon, a
// title and a one-line "what this is for", which opens to show the
// controls. Keeps settings-style pages short and calm; parents only see
// the details of what they choose to open.
export default function Section({ icon, title, hint, children, defaultOpen = false }: {
  icon: string;
  title: string;
  hint: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { theme } = useHubTheme();
  return (
    <details open={defaultOpen} className="group rounded-3xl mb-3 overflow-hidden" style={{ background: theme.surface }}>
      <summary className="flex items-center gap-3 p-4 min-h-[64px] cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <span className="text-2xl w-9 text-center flex-shrink-0" aria-hidden="true">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-extrabold text-gray-800 leading-tight">{title}</span>
          <span className="block text-sm text-gray-500 leading-snug">{hint}</span>
        </span>
        <span className="text-gray-400 text-lg flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
      </summary>
      <div className="px-4 pb-5 pt-1">{children}</div>
    </details>
  );
}
