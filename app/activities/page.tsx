'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { developmentalBand, BAND_INFO } from '@/lib/difficulty';
import {
  ACTIVITIES, DOMAIN_META, ParentActivity, ActivityDomain, ReportScore,
  todaysQuests, getTodayReports, reportActivity, streakDays,
} from '@/lib/activities';

// ─── Parent & Baby Quest Library ──────────────────────────────────────────────
// Daily real-world quests for the youngest adventurers, coached by Noel,
// played entirely off-screen, reported by the grown-up with one tap.

const SCORE_LABELS: { score: ReportScore; label: string; color: string }[] = [
  { score: 2, label: 'Did it! 🌟', color: '#059669' },
  { score: 1, label: 'Tried with help 💪', color: '#D97706' },
  { score: 0, label: 'Not yet 🌱', color: '#7C3AED' },
];

const DOMAINS = Object.keys(DOMAIN_META) as ActivityDomain[];

function ActivityCard({ activity, report, onReport, highlight }: {
  activity: ParentActivity;
  report: ReportScore | undefined;
  onReport: (a: ParentActivity, s: ReportScore) => void;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = DOMAIN_META[activity.domain];
  const done = report !== undefined;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.97)', border: highlight ? '3px solid #FBBF24' : '2px solid rgba(255,255,255,0.2)',
        boxShadow: highlight ? '0 0 18px rgba(251,191,36,0.35)' : '0 2px 10px rgba(0,0,0,0.25)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3.5 text-left">
        <span className="text-4xl" style={{ flexShrink: 0 }}>{activity.emoji}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-extrabold text-gray-800 leading-tight">{activity.title} {done && '✅'}</span>
          <span className="block text-xs font-semibold text-gray-500 mt-0.5">
            {meta.emoji} {meta.label} · ~{activity.minutes} min
          </span>
        </span>
        <span className="text-gray-400 text-lg" style={{ flexShrink: 0 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 slide-up">
          {/* Noel's framing */}
          <div className="flex items-start gap-2 rounded-xl p-2.5 mb-3" style={{ background: '#F5F3FF' }}>
            <PandaSprite size={38} expression="excited" style={{ flexShrink: 0 }} />
            <p className="text-sm font-semibold text-purple-900 pt-1.5">{activity.noel}</p>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">You&apos;ll need</p>
          <p className="text-sm text-gray-700 mb-3">{activity.materials}</p>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">How to play</p>
          <ol className="mb-3 space-y-1.5">
            {activity.steps.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="font-extrabold" style={{ color: '#7C3AED', flexShrink: 0 }}>{i + 1}.</span> {s}
              </li>
            ))}
          </ol>

          <div className="rounded-xl p-2.5 mb-4" style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0' }}>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-0.5">👀 What to watch for</p>
            <p className="text-sm text-emerald-900">{activity.watchFor}</p>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">How did it go?</p>
          <div className="flex gap-2 flex-wrap">
            {SCORE_LABELS.map(({ score, label, color }) => (
              <button key={score} onClick={() => onReport(activity, score)}
                className="px-4 py-2 rounded-full text-sm font-extrabold transition-transform hover:scale-105 active:scale-95"
                style={report === score
                  ? { background: color, color: 'white' }
                  : { background: 'white', color, border: `2px solid ${color}55` }}>
                {label}
              </button>
            ))}
          </div>
          {done && (
            <p className="text-xs text-gray-500 mt-2">
              Saved! Every report helps Kailia understand your little one better. 💜
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityLibraryPage() {
  const { state, totalScore } = useAssessment();
  const detectedBand = developmentalBand(state.ageGroup, totalScore);
  const [band, setBand] = useState<1 | 2 | 3>(detectedBand ?? 2);
  const [domainFilter, setDomainFilter] = useState<ActivityDomain | 'all'>('all');
  const [reports, setReports] = useState<{ [id: string]: ReportScore }>({});
  const [streak, setStreak] = useState(0);

  // follow the assessment once it loads from storage
  useEffect(() => { if (detectedBand) setBand(detectedBand); }, [detectedBand]);
  useEffect(() => { setReports(getTodayReports()); setStreak(streakDays()); }, []);

  const daily = useMemo(() => todaysQuests(band), [band]);
  const dailyIds = new Set(daily.map(a => a.id));
  const library = ACTIVITIES.filter(a =>
    a.band === band && !dailyIds.has(a.id) && (domainFilter === 'all' || a.domain === domainFilter));
  const doneToday = daily.filter(a => reports[a.id] !== undefined).length;
  const info = BAND_INFO[band];

  function handleReport(a: ParentActivity, s: ReportScore) {
    reportActivity(a, s);
    setReports(getTodayReports());
    setStreak(streakDays());
  }

  return (
    <main className="min-h-screen pb-10" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)' }}>
      <div className="max-w-md mx-auto px-3">

        {/* Header */}
        <div className="flex items-center justify-between pt-5 pb-1 px-1">
          <Link href="/play" className="text-sm font-bold text-purple-300">← Map</Link>
          <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">🎒 Quest Library</h1>
          <span className="text-sm font-bold text-yellow-300 w-14 text-right">
            {streak >= 2 ? `🔥 ${streak}d` : ''}
          </span>
        </div>
        <p className="text-purple-200 text-xs text-center mb-4">
          Real-world adventures you play <strong>together</strong> — no screen needed.
        </p>

        {/* Band banner */}
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <span className="text-5xl">{info.emoji}</span>
          <div className="flex-1">
            <p className="font-extrabold text-gray-800 leading-tight">
              {state.childName ? `${state.childName} the ` : 'Your '}{info.name}
              <span className="font-semibold text-gray-500 text-xs"> · {info.ages}</span>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">{info.blurb}</p>
          </div>
        </div>

        {/* Band switcher */}
        <div className="flex gap-2 mb-5 justify-center">
          {([1, 2, 3] as const).map(b => (
            <button key={b} onClick={() => { setBand(b); setDomainFilter('all'); }}
              className="px-4 py-1.5 rounded-full text-sm font-extrabold transition-all"
              style={band === b
                ? { background: '#FBBF24', color: '#451a03' }
                : { background: 'rgba(255,255,255,0.1)', color: '#e9d5ff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              {BAND_INFO[b].emoji} Band {b}
            </button>
          ))}
        </div>

        {/* ── Today's quests ── */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <h2 className="text-lg font-extrabold text-white">☀️ Today&apos;s Quests</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
            style={{ background: doneToday === 3 ? '#059669' : 'rgba(255,255,255,0.12)', color: 'white' }}>
            {doneToday} / 3 done
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-2xl p-2.5 mb-3"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <PandaSprite size={44} expression={doneToday === 3 ? 'celebrating' : 'happy'} style={{ flexShrink: 0 }} />
          <p className="text-sm font-semibold text-purple-100 pt-2">
            {doneToday === 3
              ? 'ALL THREE?! You two are unstoppable! See you tomorrow! 🎉'
              : `Noel picked ${3 - doneToday === 3 ? 'three' : 3 - doneToday} little adventure${3 - doneToday === 1 ? '' : 's'} for today — a few minutes each!`}
          </p>
        </div>
        <div className="space-y-3 mb-7">
          {daily.map(a => (
            <ActivityCard key={a.id} activity={a} report={reports[a.id]} onReport={handleReport} highlight />
          ))}
        </div>

        {/* ── Full library ── */}
        <h2 className="text-lg font-extrabold text-white mb-2 px-1">📚 The Whole Library</h2>
        <div className="flex gap-1.5 flex-wrap mb-3">
          <button onClick={() => setDomainFilter('all')}
            className="px-3 py-1 rounded-full text-xs font-extrabold"
            style={domainFilter === 'all'
              ? { background: 'white', color: '#312e81' }
              : { background: 'rgba(255,255,255,0.1)', color: '#e9d5ff' }}>
            All
          </button>
          {DOMAINS.map(d => (
            <button key={d} onClick={() => setDomainFilter(d)}
              className="px-3 py-1 rounded-full text-xs font-extrabold"
              style={domainFilter === d
                ? { background: 'white', color: '#312e81' }
                : { background: 'rgba(255,255,255,0.1)', color: '#e9d5ff' }}>
              {DOMAIN_META[d].emoji} {DOMAIN_META[d].label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {library.map(a => (
            <ActivityCard key={a.id} activity={a} report={reports[a.id]} onReport={handleReport} />
          ))}
          {library.length === 0 && (
            <p className="text-center text-purple-300 text-sm py-6">
              Today&apos;s quests cover this one — check back tomorrow! 🌙
            </p>
          )}
        </div>

        {/* Kailia sign-off + disclaimer */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <KailiaSprite size={60} expression="happy" className="float" />
          <p className="text-purple-200 text-sm font-semibold max-w-[240px]">
            &ldquo;Every little game you play together helps me know your explorer better!&rdquo;
          </p>
        </div>
        <p className="text-center text-purple-400 text-[11px] mt-5 px-4 leading-relaxed">
          These activities are a screening and play-guidance tool inspired by developmental research —
          not a diagnosis. If you have concerns about your child&apos;s development, talk with your
          pediatrician or an occupational therapist.
        </p>
      </div>
    </main>
  );
}
