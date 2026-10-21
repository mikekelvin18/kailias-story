'use client';

// ── First-time setup steps ──
// A new family goes through four screens before the world map opens:
// the story intro, the grown-up setup, the adventure check, and the
// results. On their own each screen looked like a separate page, so it
// was hard to tell where you were or what came next. This strip sits at
// the top of each one: "Step 2 of 4 · Grown-up setup", with the four
// steps shown as labelled segments (done / now / next).

export const SETUP_STEPS = [
  { label: 'Meet Kailia', emoji: '📖' },
  { label: 'Grown-up setup', emoji: '👪' },
  { label: 'Adventure check', emoji: '🧭' },
  { label: 'Your path', emoji: '🗺️' },
] as const;

export default function StepGuide({ step, tone = 'light', className = '' }: {
  step: 1 | 2 | 3 | 4;
  /** 'light' for use on a white card or pale page, 'dark' on a colorful/dark background */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  const ink = dark ? '#FFFFFF' : '#1E293B';
  const soft = dark ? 'rgba(255,255,255,0.78)' : '#475569';
  const track = dark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.12)';
  const fill = dark ? '#FFFFFF' : '#7C3AED';
  const current = SETUP_STEPS[step - 1];

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`} role="group" aria-label={`Setup step ${step} of ${SETUP_STEPS.length}: ${current.label}`}>
      <p className="text-center text-sm font-extrabold mb-2" style={{ color: ink }}>
        <span style={{ color: soft }}>Step {step} of {SETUP_STEPS.length}</span>
        <span aria-hidden="true" style={{ color: soft }}> · </span>
        {current.emoji} {current.label}
      </p>
      <ol className="flex gap-1.5" aria-hidden="true">
        {SETUP_STEPS.map((s, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'now' : 'next';
          return (
            <li key={s.label} className="flex-1 min-w-0">
              <div className="h-1.5 rounded-full" style={{ background: state === 'next' ? track : fill, opacity: state === 'done' ? 0.55 : 1 }} />
              <p className="hidden sm:block text-[11px] font-bold mt-1 truncate text-center"
                style={{ color: state === 'now' ? ink : soft, opacity: state === 'next' ? 0.75 : 1 }}>
                {state === 'done' ? '✓ ' : ''}{s.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
