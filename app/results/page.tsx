'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaAvatar from '@/components/KailiaAvatar';
import { developmentalBand, BAND_INFO } from '@/lib/difficulty';
import { COMPARISON_TEXT, type MilestoneDomain } from '@/lib/milestones';
import { fineMotorStage, traceNextStep } from '@/lib/fineMotor';
import { loadProgress } from '@/lib/adventure';
import StepGuide from '@/components/ui/StepGuide';
import BackButton from '@/components/ui/BackButton';
import ResultsDisclaimer from '@/components/ui/ResultsDisclaimer';
import StrengthsView, { ParentNotes } from '@/components/ui/StrengthsView';
import AgeCard from '@/components/ui/AgeCard';
import { gameSummaries, type GameSummary } from '@/lib/gameSummary';
import { DOMAIN_META } from '@/lib/activities';
import PlayLog from '@/components/ui/PlayLog';
import { Sparkle } from '@/components/scenery/SkyDecor';

const getFineMotorStage = fineMotorStage;

// Same names as the Parent Zone and the map (one naming set everywhere;
// Muse review 2026-11-18): the skill, then the land that practises it.
const DOMAIN_INFO = [
  { key: 'reading',       label: 'Early Books & Sounds',   land: 'Signposts',      emoji: '📖', color: '#2563EB', max: 10 },
  { key: 'writing',       label: 'Hand Skills',            land: 'Firefly Forest', emoji: '✍️', color: '#059669', max: 10 },
  { key: 'communication', label: 'Talking & Listening',    land: 'Story Keepers',  emoji: '🗣️', color: '#7C3AED', max: 10 },
  { key: 'math',          label: 'Counting & Sorting',     land: "Dragon's Cave",  emoji: '🔢', color: '#D97706', max: 10 },
  { key: 'processing',    label: 'Thinking & Remembering', land: "Owl's Tower",    emoji: '🦉', color: '#0E7490', max: 10 },
];

// One line under the breakdown, instead of a source line under every skill.
const SOURCES_LINE = 'Built from CDC milestone checklists, OT hand-skill and pencil-grip norms, early reading, number and memory research, and school-readiness benchmarks.';

const GRASP_LOOKUP: Record<string, { emoji: string; label: string; milestone: string; color: string }> = {
  palmar:          { emoji: '✊', label: 'Palmar / Fist Grip',    milestone: '~1–2 years',  color: '#EC4899' },
  digital_pronate: { emoji: '👇', label: 'Digital Pronate',       milestone: '~2–3 years',  color: '#F97316' },
  quadrupod:       { emoji: '🖐️', label: 'Quadrupod (4 fingers)',  milestone: '~3.5–4 yrs',  color: '#F59E0B' },
  immature_tripod: { emoji: '🤌', label: 'Immature Tripod',        milestone: '~4–5 years',  color: '#3B82F6' },
  dynamic_tripod:  { emoji: '✏️', label: 'Dynamic Tripod (mature)', milestone: '~5–6+ yrs',   color: '#059669' },
};

const SENSORY_PATTERNS = [
  { key: 'lowRegistration', label: 'Low Registration',  color: '#94A3B8' },
  { key: 'seeking',         label: 'Sensory Seeking',   color: '#3B82F6' },
  { key: 'sensitive',       label: 'Sensory Sensitive', color: '#8B5CF6' },
  { key: 'avoiding',        label: 'Sensory Avoiding',  color: '#D97706' },
];
const SENSORY_MAX = 6; // per pattern: 3 questions × 2 points

// A folded section (Kelvin, 2026-11-27: senses and home activities fold
// away so the page stays light; the closed row says what's inside).
function Fold({ title, hint, light, children, testId }: { title: string; hint?: string; light?: boolean; children: React.ReactNode; testId?: string }) {
  return (
    <details data-testid={testId} className="group rounded-3xl mb-6 overflow-hidden"
      style={light ? { background: 'rgba(255,255,255,0.95)' } : { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }}>
      <summary className="flex items-center gap-3 px-5 py-4 min-h-[56px] cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
        <span className="flex-1 min-w-0">
          <span className={`block text-lg font-bold ${light ? 'text-gray-800' : 'text-white'}`}>{title}</span>
          {hint && <span className={`block text-sm ${light ? 'text-gray-500' : 'text-slate-300'}`}>{hint}</span>}
        </span>
        <span className={`text-lg transition-transform group-open:rotate-180 ${light ? 'text-gray-500' : 'text-slate-300'}`} aria-hidden="true">▾</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

const STAGE_ACTIVITIES: Record<string, { title: string; activities: string[] }> = {
  'Early Explorer': {
    title: 'Perfect starting point activities:',
    activities: [
      '📚 Read picture books together every day',
      '🖍️ Practice drawing circles, lines, and shapes',
      '🎵 Sing songs and nursery rhymes',
      '🔢 Count objects around the house (spoons, toys)',
      '🧩 Do simple puzzles with 4–6 pieces',
      '🌊 Water play and sand sensory activities',
      '🤲 Finger painting and playdough squishing',
    ],
  },
  'Growing Learner': {
    title: 'Great activities for this stage:',
    activities: [
      '📚 Read picture books with repeated text',
      '🖍️ Scribble, stack, and sort objects by colour',
      '🎵 Sing action songs and copy movements',
      '🔢 Count and point to objects up to 5',
      '🌀 Roll, pour, and squish soft materials',
      '🏗️ Stack blocks and knock them down',
      '🎭 Pretend play with dolls, cars, or kitchen sets',
    ],
  },
  'Curious Explorer': {
    title: 'Activities to build on strengths:',
    activities: [
      '📚 Read simple stories and ask "what happens next?"',
      '✏️ Trace letters and draw simple pictures',
      '💬 Ask your child to describe pictures',
      '🔢 Practice counting 1–20 and simple patterns',
      '🧩 Build with blocks and do puzzles',
      '✂️ Practice safe scissor cutting along lines',
      '🎲 Play simple board games to build turn-taking',
    ],
  },
  'Bright Starter': {
    title: 'Activities to keep growing:',
    activities: [
      '📖 Explore books with simple words together',
      '✏️ Practise name writing and letter tracing',
      '💬 Play "I Spy" and describing games',
      '🔢 Count to 20 and sort by shape or colour',
      '🎨 Arts and crafts to build fine motor skills',
      '🔡 Magnetic letter boards and alphabet puzzles',
      '🎯 Simple hopscotch and ball games for coordination',
    ],
  },
  'Skill Builder': {
    title: 'Great next-step activities:',
    activities: [
      '📖 Practice sounding out simple words (cat, dog, run)',
      '✏️ Write your name and copy simple sentences',
      '💬 Describe your day in 3–4 sentences',
      '🔢 Practice adding numbers up to 20',
      '📚 Read short books independently',
      '🗺️ Draw simple maps of your home or neighbourhood',
      '🎮 Educational apps for phonics and early math',
    ],
  },
  'Confident Explorer': {
    title: 'Challenge activities for this level:',
    activities: [
      '📗 Read chapter books independently',
      '📝 Write short stories with a beginning, middle, and end',
      '🗣️ Give a 1-minute presentation about a favourite topic',
      '➗ Practice multiplication and division',
      '🌍 Explore informational books and non-fiction',
      '📊 Create a simple chart or graph from real-life data',
      '♟️ Play chess, Scrabble, or strategy board games',
    ],
  },
  'Independent Thinker': {
    title: 'Advanced exploration activities:',
    activities: [
      '📰 Read news articles and discuss main ideas',
      '📓 Keep a daily journal with detailed entries',
      '🎤 Join a debate or storytelling club',
      '🔬 Explore science projects with math data',
      '📚 Read biographies and historical fiction',
      '💻 Learn basic coding with Scratch or Python',
      '🌐 Research a topic of interest and present findings',
    ],
  },
};

export default function ResultsPage() {
  const {
    state, totalScore, learningStage, stageDescription,
    domainRange, domainComparison, estimates, chronoMonths, devMonths, resetAssessment, loaded,
    primarySensoryPattern, sensoryPatternDescription,
  } = useAssessment();
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);
  const [confirmingRetake, setConfirmingRetake] = useState(false);
  const band = developmentalBand(state.ageGroup, totalScore, devMonths);
  // Offered only when a choice-question area reads "at or above their age".
  const canChallenge = (['reading', 'communication', 'math'] as const).some(k => estimates[k]?.atOrAbove);
  const anyGrowing = (['reading', 'writing', 'communication', 'math', 'processing'] as const).some(k => domainComparison(k) === 'growing');
  // Right after the first adventure check (nothing played on the map
  // yet) this is the last of the four setup steps; afterwards it's a
  // regular results page reached from the map or the Parent Zone.
  const [firstVisit, setFirstVisit] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device
  useEffect(() => { setGames(gameSummaries()); }, []);
  useEffect(() => {
    const p = loadProgress();
    setFirstVisit(Object.keys(p.played).length === 0);
  }, []);

  useEffect(() => {
    // COPPA: child data stays on this device only — no cloud upload.
    // (The old Supabase insert was removed; see SECURITY.md.)
    const t = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const activities = STAGE_ACTIVITIES[learningStage] || STAGE_ACTIVITIES['Skill Builder'];

  const handleStartOver = () => { resetAssessment(); router.push('/'); };

  // Nothing until the saved check has loaded: the first frame used to show
  // the empty defaults ("Early Explorer, about 5–6 years") and old-style
  // activities, then swap (Muse review, 2026-11-18).
  if (!loaded) {
    return <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1A2238 0%, #222849 60%, #1E2F4D 100%)' }} />;
  }

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-start px-4 py-8 ${firstVisit ? 'pb-28' : ''}`}
      style={{ background: 'linear-gradient(180deg, #1A2238 0%, #222849 60%, #1E2F4D 100%)' }}
    >
      {/* Celebration burst */}
      {/* Celebration: drawn sparkles burst around the edges for a few
          seconds (no emoji, and nothing lands on top of the heading). */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[5] print:hidden" aria-hidden="true">
          {[...Array(14)].map((_, i) => (
            <span key={i} className="absolute bounce-in"
              style={{ left: `${i % 2 ? 88 - (i % 5) * 3 : 4 + (i % 5) * 3}%`, top: `${8 + (i * 13) % 84}%`, animationDelay: `${i * 0.08}s` }}>
              <Sparkle size={18 + (i % 4) * 8} color={['#FDE68A', '#F5D0FE', '#FFFFFF', '#A7F3D0'][i % 4]} />
            </span>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full relative z-10">
        {firstVisit
          ? <StepGuide step={4} tone="dark" className="mb-8" />
          : <div className="mb-6 print:hidden"><BackButton href="/play" label="Map" /></div>}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="float inline-block"><KailiaAvatar size={90} /></div>
          <h1 className="text-4xl font-extrabold text-white mt-4 drop-shadow-lg">
            {state.childName ? `${state.childName}'s Adventure Map!` : 'Your Adventure Map!'}
          </h1>
        </div>

        {/* Stage: one calm line (the big emoji card was trimmed, 2026-11-27) */}
        <div className="rounded-3xl px-5 py-4 mb-6 text-center shadow-xl bounce-in"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-100">Stage</p>
          <h2 className="text-2xl font-extrabold text-white">{learningStage}</h2>
          <p className="text-purple-100 text-sm leading-snug mt-0.5">{stageDescription}</p>
        </div>

        {/* Strengths first (Kelvin, 2026-11-25), then the rough age range,
            always showing (Kelvin, 2026-11-27). Only the skill-by-skill
            breakdown is folded away. */}
        <StrengthsView name={state.childName} />
        <AgeCard>
        {/* Domain breakdown */}
        <div className="text-left">
          <div className="space-y-5">
            {DOMAIN_INFO.filter(d => d.key !== 'processing' || estimates.processing).map(d => {
              const score = state.scores[d.key as keyof typeof state.scores] ?? 0;
              // Bar: where the range's middle sits next to the child's age
              // (about two-thirds full = right at their age).
              const est = estimates[d.key as MilestoneDomain];
              const pct = est && chronoMonths
                ? Math.round(Math.min(100, (est.mid / chronoMonths) * 66))
                : Math.round((score / d.max) * 100);
              const age = domainRange(d.key as MilestoneDomain);
              const cmp = domainComparison(d.key as MilestoneDomain);
              const isWriting = d.key === 'writing';
              const inputMethod = state.fineMotorInputMethod;
              const graspInfo = state.graspPattern ? GRASP_LOOKUP[state.graspPattern] : null;
              return (
                <div key={d.key}>
                  <p className="text-white font-bold text-sm">
                    {d.label} <span className="text-slate-400 text-xs font-normal">· {d.land}</span>
                  </p>
                  <p className="text-sm mt-0.5 mb-1.5">
                    <span className="font-bold" style={{ color: 'white' }}>{age.replace(/, at or above their age$/, '')}</span>
                    {cmp && (
                      <span className="text-xs font-semibold" style={{ color: cmp === 'growing' ? '#FCD34D' : cmp === 'ahead' ? '#6EE7B7' : '#BFDBFE' }}>
                        {' '}· {COMPARISON_TEXT[cmp].label}
                      </span>
                    )}
                  </p>
                  <div className="h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: d.color, minWidth: 6 }} />
                  </div>
                  {isWriting && inputMethod && (
                    <p className="text-purple-300 text-xs mt-0.5">
                      {inputMethod === 'touch'
                        ? '👆 Assessed via touchscreen tracing'
                        : '🖱️ Assessed via mouse tracing (touchscreen recommended for best accuracy)'}
                    </p>
                  )}
                  {isWriting && graspInfo && (
                    <p className="text-purple-200 text-xs mt-1">
                      {graspInfo.emoji}{' '}
                      <span className="font-semibold" style={{ color: graspInfo.color }}>{graspInfo.label}</span>
                      {' — '}typical at {graspInfo.milestone}
                    </p>
                  )}
                  {isWriting && state.fineMotorSubScores && (() => {
                    const fm = getFineMotorStage(state.fineMotorSubScores!.composite);
                    const next = traceNextStep(state.fineMotorSubScores!);
                    return (
                      <>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: fm.color }}>
                          {fm.emoji} Fine Motor: {fm.stage}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${state.fineMotorSubScores!.composite}%`, background: fm.color }} />
                        </div>
                        <span className="text-slate-300 text-xs">{state.fineMotorSubScores!.composite}%</span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1">
                        Tracing, compared with what&apos;s typical at this age: {fm.description}
                        {next && <> <span className="text-emerald-300 font-semibold">Try next:</span> {next.tip}</>}
                      </p>
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
          <p className="text-slate-400 text-xs mt-5">{SOURCES_LINE}</p>
          {anyGrowing && (
            <p className="text-sm mt-5 rounded-2xl p-4" style={{ background: 'rgba(252,211,77,0.12)', color: '#FDE68A' }}>
              {COMPARISON_TEXT.growing.note} You know your child best: if anything worries you, ask your
              child&apos;s doctor about a developmental check. Getting help early makes a real difference.
            </p>
          )}
          {/* Challenge round: one quiet link (Kelvin: no clutter) for a
              grown-up who thinks their child is ahead. Only harder questions. */}
          {canChallenge && (
            <p className="text-sm text-slate-300 mt-5 text-center">
              Think {state.childName || 'your child'} is ahead?{' '}
              <button onClick={() => router.push('/assessment/games?challenge=1')}
                className="font-bold underline underline-offset-2 text-amber-200 hover:text-amber-100">
                Try the challenge round
              </button>
              <span className="text-slate-400"> (harder questions, about 5 min)</span>
            </p>
          )}
        </div>

        </AgeCard>

        <ParentNotes />

        {/* Senses: folded, the style name shows on the closed row */}
        {state.sensoryCompleted ? (
          <Fold testId="senses-fold" title="Senses" hint={primarySensoryPattern ? `Style: ${primarySensoryPattern}` : undefined}>
            {primarySensoryPattern && (
              <p className="text-slate-200 text-sm leading-relaxed mb-4">{sensoryPatternDescription}</p>
            )}
            <div className="space-y-3">
              {SENSORY_PATTERNS.map(p => {
                const score = state.sensoryScores[p.key as keyof typeof state.sensoryScores];
                const isPrimary = p.label === primarySensoryPattern;
                return (
                  <div key={p.key}>
                    <p className="text-sm text-white font-semibold mb-1">
                      {p.label}{isPrimary && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: p.color }}>Main style</span>}
                    </p>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${Math.round((score / SENSORY_MAX) * 100)}%`, background: p.color, minWidth: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-slate-400 text-xs mt-4">
              A sensory style from your answers (Dunn&apos;s Sensory Processing Model), not an age or a diagnosis.
            </p>
          </Fold>
        ) : (
          /* Sensory CTA — not yet completed */
          <button
            onClick={() => router.push('/assessment/sensory')}
            className="w-full rounded-3xl p-5 mb-6 text-left transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(124,58,237,0.15)', border: '2px dashed rgba(167,139,250,0.6)' }}
          >
            <span className="block text-white font-extrabold text-lg">Senses: a 3-minute grown-up survey →</span>
            <span className="block text-purple-200 text-sm mt-1">12 quick questions on how {state.childName || 'your child'} takes in sights, sounds and touch.</span>
          </button>
        )}

        {/* Activities to keep growing: the full list, folded (Kelvin, 2026-11-27) */}
        <Fold testId="activities-fold" light title="Activities to keep growing" hint={`${activities.activities.length} ideas to try at home`}>
          <ul className="space-y-2">
            {activities.activities.map((act, i) => (
              <li key={i} className="rounded-xl px-3 py-2.5 text-gray-700 font-medium" style={{ background: '#F8F0FF' }}>
                {act.split(' ').slice(1).join(' ')}
              </li>
            ))}
          </ul>
        </Fold>

        {/* What the child has played since the check (games only log numbers;
            they never change the age range above) */}
        <div className="rounded-3xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }}>
          <h3 className="text-lg font-bold text-white mb-2">Games played</h3>
          <PlayLog />
          {games.length === 0 ? (
            <p className="text-slate-300 text-sm">Finished games show up here.</p>
          ) : (
            <div className="space-y-2">
              {games.slice(0, 3).map(g => (
                <div key={g.id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{g.title}</p>
                    <p className="text-slate-300 text-xs">{DOMAIN_META[g.domain as keyof typeof DOMAIN_META]?.label ?? g.domain} · last played {new Date(g.lastPlayed).toLocaleDateString()}</p>
                  </div>
                  <span className="text-right flex-shrink-0 text-xs text-slate-200">
                    <span className="block font-bold">finished {g.finished}×</span>
                    {g.highestLevel > 0 && <span className="block text-slate-300">up to level {g.highestLevel}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
          <a href="/progress" className="inline-block mt-3 text-sm font-bold text-purple-200 underline">Full progress report →</a>
        </div>

        {/* Disclaimer */}
        <ResultsDisclaimer />

        {/* Parent & Baby Quest Library — the main path for the littlest ones */}
        {band !== null && (
          <button
            onClick={() => router.push('/activities')}
            className="w-full rounded-2xl p-5 mb-4 text-left transition-all hover:scale-[1.02] shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-5xl">{BAND_INFO[band].emoji}</span>
              <div>
                <p className="font-extrabold text-amber-950 text-lg leading-tight">
                  {state.childName || 'Your child'} is a {BAND_INFO[band].name}!
                </p>
                <p className="text-sm font-semibold text-amber-900 mt-1">
                  At this developmental level, the best &ldquo;games&rdquo; are played together, off the
                  screen — Noel has 3 daily quests and a whole library waiting for you. →
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => router.push('/play')}
            className="w-full py-5 rounded-full font-extrabold text-xl text-white shadow-2xl transition-all hover:scale-105 pulse"
            style={{ background: 'linear-gradient(135deg, #059669, #2563EB, #7C3AED)' }}
          >
            {firstVisit ? '🗺️ Open Kailia’s World →' : '🗺️ Back to Kailia’s World'}
          </button>
          {!confirmingRetake ? (
            <button
              onClick={() => setConfirmingRetake(true)}
              className="w-full py-3 rounded-full font-bold text-lg text-slate-100 transition-all hover:bg-white/10"
              style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'transparent' }}
            >
              🔄 Retake the Questionnaire
            </button>
          ) : (
            <div className="w-full rounded-3xl p-5" style={{ background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(236,72,153,0.5)' }}>
              <p className="text-white font-bold mb-1">Are you sure?</p>
              <p className="text-purple-100 text-sm mb-4">
                This clears {state.childName || 'your child'}&apos;s current results and asks every
                question again from scratch. Most families only see meaningful change if they wait
                at least <strong>2–3 months</strong> between screenings — similar to how progress
                notes are typically spaced in OT/EI practice. Retaking too soon won&apos;t show much
                difference.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmingRetake(false)}
                  className="flex-1 py-3 rounded-full font-bold text-white"
                  style={{ border: '2px solid rgba(255,255,255,0.35)', background: 'transparent' }}>
                  Cancel
                </button>
                <button onClick={handleStartOver}
                  className="flex-1 py-3 rounded-full font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                  Yes, retake it
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-full font-bold text-lg text-slate-100 transition-all hover:bg-white/10"
            style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'transparent' }}
          >
            🖨️ Print These Results
          </button>
        </div>
      </div>

      {/* First visit: the way forward stays on screen while the parent
          reads, instead of waiting at the very bottom of a long page. */}
      {firstVisit && (
        <div className="fixed bottom-0 inset-x-0 z-20 px-4 pb-4 pt-3 print:hidden"
          style={{ background: 'linear-gradient(180deg, rgba(26,34,56,0), rgba(26,34,56,0.92) 35%)' }}>
          <button onClick={() => router.push('/play')}
            className="block w-full max-w-2xl mx-auto py-4 rounded-full font-extrabold text-lg sm:text-xl text-white shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #059669, #2563EB, #7C3AED)' }}>
            Open Kailia&rsquo;s World →
          </button>
        </div>
      )}
    </main>
  );
}
