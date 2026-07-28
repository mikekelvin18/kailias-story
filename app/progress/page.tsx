'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { activeChild } from '@/lib/family';
import { DOMAIN_META, domainSummaries, allReportEntries, DomainSummary, ReportEntry } from '@/lib/activities';
import { loadCustomTasks, CustomTask } from '@/lib/customTasks';
import BottomNav from '@/components/BottomNav';

// ─── Progress Report ───────────────────────────────────────────────────────
// A parent-facing, printable rollup for handing to a child's care team
// (OT/PT/SLP, teacher, pediatrician) — built entirely from data the
// family already has (the initial assessment + the daily one-tap
// reports), never anything new collected just for this page.

export default function ProgressReportPage() {
  const { state, domainAge, primarySensoryPattern, sensoryPatternDescription } = useAssessment();
  const [child, setChild] = useState<ReturnType<typeof activeChild>>(null);
  const [summaries, setSummaries] = useState<DomainSummary[]>([]);
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);

  useEffect(() => {
    setChild(activeChild());
    setSummaries(domainSummaries());
    setEntries(allReportEntries());
    setCustomTasks(loadCustomTasks());
  }, []);

  const recent = [...entries].reverse().slice(0, 20);
  const scoreLabel = (s: 0 | 1 | 2) => s === 2 ? 'Did it' : s === 1 ? 'Tried with help' : 'Not yet';
  const scoreColor = (s: 0 | 1 | 2) => s === 2 ? '#059669' : s === 1 ? '#D97706' : '#7C3AED';

  return (
    <main className="min-h-screen pb-24 print:pb-4" style={{ background: '#F8FAFC' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="max-w-md sm:max-w-2xl mx-auto px-4 pt-6 print:pt-0">
        <div className="flex items-center justify-between mb-3 no-print">
          <Link href="/family" className="text-sm font-bold text-indigo-700">← Family</Link>
          <button onClick={() => window.print()}
            className="px-4 py-2 rounded-full font-bold text-sm text-white" style={{ background: '#2563EB' }}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">📋 Progress Report</h1>
          <p className="text-sm text-slate-500">
            {child ? `${child.nickname}` : 'Your child'} · generated {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="rounded-2xl p-3 mb-6" style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
          <p className="text-xs text-blue-900">
            This is a screening and play-guidance summary inspired by developmental research —{' '}
            <strong>not a clinical diagnosis</strong>. Share freely with an Occupational Therapist,
            Speech-Language Pathologist, Physical Therapist, teacher, or pediatrician for context on
            what {child ? child.nickname : 'your child'} has been practicing at home.
          </p>
        </div>

        {/* Developmental snapshot from the initial assessment */}
        {state.childName && (
          <section className="mb-6">
            <h2 className="text-sm font-extrabold text-slate-700 mb-2">Developmental Snapshot (from screening)</h2>
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              {([
                ['📖 Reading', state.scores.reading],
                ['✍️ Fine Motor / Writing', state.scores.writing],
                ['🗣️ Communication', state.scores.communication],
                ['🔢 Math', state.scores.math],
              ] as [string, number][]).map(([label, score]) => (
                <div key={label} className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-sm font-bold text-slate-500">{domainAge(score)}</span>
                </div>
              ))}
              {primarySensoryPattern && (
                <div className="px-3 py-2 bg-white">
                  <span className="text-sm font-semibold text-slate-700">🌈 Sensory pattern: </span>
                  <span className="text-sm font-bold text-slate-500">{primarySensoryPattern}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{sensoryPatternDescription}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Daily quest activity, tallied per skill */}
        <section className="mb-6">
          <h2 className="text-sm font-extrabold text-slate-700 mb-2">At-Home Practice Summary</h2>
          {summaries.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No daily quest reports yet — they'll show up here once a few are logged.</p>
          ) : (
            <div className="space-y-2">
              {summaries.map(s => (
                <div key={s.domain} className="rounded-2xl p-3 bg-white border border-slate-200">
                  <p className="text-sm font-bold text-slate-700 mb-1.5">
                    {DOMAIN_META[s.domain].emoji} {DOMAIN_META[s.domain].label} <span className="text-slate-400 font-semibold">({s.total} logged)</span>
                  </p>
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                    <div style={{ width: `${(s.did / s.total) * 100}%`, background: '#059669' }} />
                    <div style={{ width: `${(s.withHelp / s.total) * 100}%`, background: '#D97706' }} />
                    <div style={{ width: `${(s.notYet / s.total) * 100}%`, background: '#7C3AED' }} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s.did} did it · {s.withHelp} with help · {s.notYet} not yet
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Custom goals a professional/parent set */}
        {customTasks.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-extrabold text-slate-700 mb-2">Custom Goals In Progress</h2>
            <div className="space-y-2">
              {customTasks.map(t => (
                <div key={t.id} className="rounded-2xl p-3 bg-white border border-slate-200 flex items-center gap-2">
                  <span className="text-lg">{DOMAIN_META[t.domain].emoji}</span>
                  <p className="text-sm font-semibold text-slate-700">{t.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent log */}
        <section className="mb-6">
          <h2 className="text-sm font-extrabold text-slate-700 mb-2">Recent Activity Log</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nothing logged yet.</p>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-slate-200">
              {recent.map((e, i) => (
                <div key={`${e.date}-${e.activityId}-${i}`}
                  className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{DOMAIN_META[e.domain].emoji} {e.title}</p>
                    <p className="text-[11px] text-slate-400">{e.date}</p>
                  </div>
                  <span className="text-[11px] font-bold flex-shrink-0" style={{ color: scoreColor(e.score) }}>
                    {scoreLabel(e.score)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[11px] text-slate-400 mb-4">
          Kailia's Story · a screening and play-guidance tool, not a diagnosis.
        </p>
      </div>
      <div className="no-print"><BottomNav /></div>
    </main>
  );
}
