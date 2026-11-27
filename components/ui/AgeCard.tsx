'use client';

// ── The rough age range, always showing (Kelvin, 2026-11-27) ──
// Sits under the strengths on /results and /progress: one line with the
// range, a soft bar with today's age marked, and a "rough estimate" tag.
// Only the skill-by-skill breakdown stays folded away. Always a range,
// never a single age.

import { useAssessment } from '@/context/AssessmentContext';

type Tone = 'dark' | 'light';

function ageText(m: number): string {
  if (m < 24) return `${Math.floor(m)} mo`;
  const y = Math.floor(m / 12), mo = Math.floor(m % 12);
  return mo ? `${y} yrs ${mo} mo` : `${y} yrs`;
}

/** `children` is the skill-by-skill breakdown: folded under one quiet row
 *  at the bottom of the card (`open` unfolds it, e.g. when printing). */
export default function AgeCard({ tone = 'dark', children, open }: { tone?: Tone; children?: React.ReactNode; open?: boolean }) {
  const { developmentalAge, overallEstimate: est, chronoMonths } = useAssessment();
  const dark = tone === 'dark';
  // "About 6 to 6½ years, at or above their age" → the range on the big
  // line, the rest as a small note under it.
  const [range, ...rest] = developmentalAge.split(', ');
  const note = rest.join(', ');

  // Bar scale: the range and today's age, with room either side.
  let bar: { from: number; to: number; today: number | null; openTop: boolean } | null = null;
  if (est) {
    const lo = Math.min(est.low, chronoMonths ?? est.low);
    const hi = Math.max(est.high, chronoMonths ?? est.high);
    const pad = Math.max(6, (hi - lo) * 0.4);
    const min = Math.max(0, lo - pad), span = hi + pad - min;
    const at = (m: number) => Math.round(((m - min) / span) * 1000) / 10;
    bar = { from: at(est.low), to: at(est.high), today: chronoMonths != null ? at(chronoMonths) : null, openTop: !!est.openTop };
  }

  const card = dark
    ? { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }
    : { background: '#FFFFFF', border: '1px solid #E2E8F0' };
  const track = dark ? 'rgba(255,255,255,0.12)' : '#EEF2F7';
  const band = dark
    ? 'linear-gradient(90deg, rgba(196,181,253,0.55), rgba(167,139,250,0.9), rgba(196,181,253,0.55))'
    : 'linear-gradient(90deg, #DDD6FE, #A78BFA, #DDD6FE)';

  return (
    <section data-testid="age-card" className="rounded-3xl p-5 mb-6 overflow-hidden" style={card}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className={`text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-500'}`}>Overall level</h3>
        <span className="text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5"
          style={dark ? { background: 'rgba(255,255,255,0.12)', color: '#E2E8F0' } : { background: '#F1F5F9', color: '#475569' }}>
          Rough estimate
        </span>
      </div>
      <p className={`text-2xl font-extrabold leading-tight ${dark ? 'text-white' : 'text-slate-800'}`}>{range}</p>
      {note && <p className={`text-sm mt-0.5 ${dark ? 'text-emerald-200' : 'text-emerald-700'}`}>{note.charAt(0).toUpperCase() + note.slice(1)}</p>}

      {bar && (
        <div className="mt-4" aria-hidden="true">
          <div className="relative h-3 rounded-full" style={{ background: track }}>
            <div className="absolute inset-y-0 rounded-full"
              style={{
                left: `${bar.from}%`, width: `${Math.max(4, bar.to - bar.from)}%`, background: band,
                ...(bar.openTop ? { maskImage: 'linear-gradient(90deg, #000 70%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, #000 70%, transparent)' } : {}),
              }} />
            {bar.today != null && (
              <div className="absolute rounded-full"
                style={{ left: `calc(${bar.today}% - 2px)`, top: -4, width: 4, height: 20, background: dark ? '#FDE68A' : '#B45309' }} />
            )}
          </div>
          {bar.today != null && chronoMonths != null && (
            <div className="relative h-5 mt-1.5">
              <span className={`absolute text-xs font-semibold whitespace-nowrap ${dark ? 'text-amber-100' : 'text-amber-800'}`}
                style={{ left: `${bar.today}%`, transform: `translateX(-${Math.min(100, Math.max(0, bar.today))}%)` }}>
                Today: {ageText(chronoMonths)}
              </span>
            </div>
          )}
        </div>
      )}

      {children && (
        <details data-testid="age-details" className="group mt-3 -mx-5 -mb-5" open={open}>
          <summary className={`flex items-center gap-2 px-5 py-3.5 min-h-[48px] cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none text-sm font-bold ${dark ? 'text-purple-200' : 'text-violet-700'}`}
            style={{ borderTop: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #EEF2F7' }}>
            <span className="flex-1">Each skill, one by one</span>
            <span className="transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <div className="px-5 pb-5">{children}</div>
        </details>
      )}
    </section>
  );
}
