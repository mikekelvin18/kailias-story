'use client';

// ── "Shining at / Growing in / Try next" ──
// The top of the grown-ups' results and progress pages (Kelvin, 2026-11-25:
// strengths first, the rough age range only under "Details"). Also the
// gentle notes from the "Your turn to talk" taps and the feelings
// check-ins. Words only; no scores.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { buildStrengths, STRENGTHS_LINE, type StrengthsView as View } from '@/lib/strengths';
import { gameSummaries } from '@/lib/gameSummary';
import { talkSummary } from '@/lib/talk';
import { feelingSummary } from '@/lib/wellbeing';

type Tone = 'dark' | 'light';

function Heading({ children, tone, color }: { children: React.ReactNode; tone: Tone; color: string }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-extrabold mb-2" style={{ color: tone === 'dark' ? '#FFFFFF' : '#1E293B' }}>
      <span aria-hidden="true" className="inline-block rounded-full" style={{ width: 12, height: 12, background: color }} />
      {children}
    </h3>
  );
}

export default function StrengthsView({ tone = 'dark', name }: { tone?: Tone; name?: string }) {
  const { estimates, chronoMonths, domainComparison, state } = useAssessment();
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device
    setView(buildStrengths({ estimates, chronoMonths, compare: domainComparison, scores: state.scores, games: gameSummaries() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimates, chronoMonths, state.scores]);
  if (!view) return null;
  const dark = tone === 'dark';
  const card = dark
    ? { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }
    : { background: '#FFFFFF', border: '1px solid #E2E8F0' };
  const body = dark ? 'text-slate-200' : 'text-slate-600';
  const who = name || 'your child';

  return (
    <section data-testid="strengths" className="rounded-3xl p-5 mb-6 shadow-xl" style={card}>
      <h2 className={`text-xl font-extrabold mb-1 ${dark ? 'text-white' : 'text-slate-800'}`}>
        {name ? `${name}'s strengths` : 'Strengths'}
      </h2>
      <p className={`text-sm mb-4 ${body}`}>{STRENGTHS_LINE}</p>

      {view.empty ? (
        <p className={`text-sm ${body}`}>Play a few quests and finish the check-up, and {who}&apos;s strengths will show up here.</p>
      ) : (
        <div className="space-y-5">
          <div>
            <Heading tone={tone} color="#34D399">Shining at</Heading>
            <ul className="space-y-1.5">
              {view.shining.map(s => (
                <li key={s.skill.key} className={`text-sm ${body}`}>
                  <strong className={dark ? 'text-emerald-200' : 'text-emerald-700'}>{s.skill.label}</strong>: {s.why}
                </li>
              ))}
            </ul>
          </div>
          {view.growing.length > 0 && (
            <div>
              <Heading tone={tone} color="#FBBF24">Growing in</Heading>
              <ul className="space-y-1.5">
                {view.growing.map(s => (
                  <li key={s.skill.key} className={`text-sm ${body}`}>
                    <strong className={dark ? 'text-amber-200' : 'text-amber-700'}>{s.skill.label}</strong>: {s.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <Heading tone={tone} color="#A78BFA">Try next</Heading>
            <ul className="space-y-2">
              {view.tryNext.map(t => (
                <li key={t.href + t.title}>
                  <Link href={t.href} className="block rounded-2xl px-3 py-2.5 min-h-[48px]"
                    style={dark ? { background: 'rgba(167,139,250,0.16)', border: '1px solid rgba(196,181,253,0.35)' } : { background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <span className={`block text-sm font-extrabold ${dark ? 'text-violet-100' : 'text-violet-800'}`}>{t.title} →</span>
                    <span className={`block text-xs mt-0.5 ${body}`}>{t.why}</span>
                  </Link>
                </li>
              ))}
              {view.home.map(h => (
                <li key={h} className={`text-sm ${body}`}><strong className={dark ? 'text-white' : 'text-slate-700'}>At home:</strong> {h}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

/** Gentle notes from the "Your turn!" taps and the feelings check-ins. */
export function ParentNotes({ tone = 'dark' }: { tone?: Tone }) {
  const [talk, setTalk] = useState<string[]>([]);
  const [feel, setFeel] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device
    setTalk(talkSummary()); setFeel(feelingSummary());
  }, []);
  const dark = tone === 'dark';
  const card = dark
    ? { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }
    : { background: '#FFFFFF', border: '1px solid #E2E8F0' };
  const body = dark ? 'text-slate-200' : 'text-slate-600';
  return (
    <section data-testid="parent-notes" className="rounded-3xl p-5 mb-6" style={card}>
      <Heading tone={tone} color="#F472B6">Talking &amp; listening</Heading>
      {talk.length ? (
        <ul className="space-y-1 mb-4">{talk.map(t => <li key={t} className={`text-sm ${body}`}>{t}</li>)}</ul>
      ) : (
        <p className={`text-sm mb-4 ${body}`}>
          When Kailia says &ldquo;Your turn!&rdquo;, tap the Grown-up button to note how it went. Nothing is recorded.
        </p>
      )}
      <Heading tone={tone} color="#60A5FA">Feelings</Heading>
      {feel.length ? (
        <ul className="space-y-1">{feel.map(t => <li key={t} className={`text-sm ${body}`}>{t}</li>)}</ul>
      ) : (
        <p className={`text-sm ${body}`}>After each land, Kailia asks how your child feels. Answers show up here.</p>
      )}
    </section>
  );
}
