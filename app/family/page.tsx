'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import {
  FamilyAccount, loadFamily, recordConsent, addChild, activeChild, setActiveChild,
  deleteChildAndData, deleteEverything, childDataInventory, DataSection, POLICY_VERSION,
} from '@/lib/family';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { AccessibilityPrefs, DEFAULT_A11Y, loadA11y, saveA11y, applyA11y } from '@/lib/accessibility';
import { useHubTheme } from '@/hooks/useHubTheme';
import { CustomTask, loadCustomTasks, addCustomTask, removeCustomTask } from '@/lib/customTasks';
import { DOMAIN_META, ActivityDomain } from '@/lib/activities';
import { LANDS, recordQuestPlay } from '@/lib/adventure';
import { useAssessment } from '@/context/AssessmentContext';
import BackButton from '@/components/ui/BackButton';
import StepGuide from '@/components/ui/StepGuide';
import Section from '@/components/ui/Section';

// Developer-only tools show up only in `npm run dev`, never in a deployed build.
const DEV_TOOLS = process.env.NODE_ENV === 'development';

// ── Parent Zone ──
// Consent first, then a minimal child profile, then full parental rights:
// view every piece of stored data, delete the child profile, delete it all.

const AVATARS = [
  '🐱', '🐶', '🦊', '🐰', '🐻', '🐼', '🦁', '🐯',
  '🐨', '🐘', '🐧', '🦉', '🐸', '🦄', '🐢', '🐝', '🦋', '🐬',
];
// "Age 4", or "14 months" for little ones (childAgeYears rounds those to 0.5/1).
function ageLabel(c: { birthYear: number; birthMonth: number }) {
  const now = new Date();
  const months = (now.getFullYear() - c.birthYear) * 12 + (now.getMonth() + 1 - c.birthMonth);
  return months < 24 ? `${Math.max(months, 0)} months old` : `Age ${Math.floor(months / 12)}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const COLLECTED = [
  ['👤', 'A nickname, birth month/year, and a cartoon avatar you choose — never a last name, photo, email, or location.'],
  ['🎯', 'How quests go: which games were played, accuracy, attempts, and speed — used only to estimate developmental progress.'],
  ['☀️', 'Your one-tap reports on daily activities (did it / tried with help / not yet).'],
];

export default function ParentZonePage() {
  const [family, setFamily] = useState<FamilyAccount | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [nickname, setNickname] = useState('');
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthYear, setBirthYear] = useState(0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [formError, setFormError] = useState('');
  const [showData, setShowData] = useState(false);
  const [inventory, setInventory] = useState<DataSection[]>([]);
  const [confirmingChild, setConfirmingChild] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState('');
  const [a11y, setA11y] = useState<AccessibilityPrefs>(DEFAULT_A11Y);
  const [showAddChild, setShowAddChild] = useState(false);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDomain, setNewTaskDomain] = useState<ActivityDomain>('communication');
  const { theme, name: themeName } = useHubTheme();
  const bright = themeName === 'bright';
  const { state: assessment, loaded: assessmentLoaded } = useAssessment();

  useEffect(() => { setFamily(loadFamily()); setLoaded(true); setA11y(loadA11y()); setCustomTasks(loadCustomTasks()); }, []);

  function handleAddTask() {
    if (!newTaskText.trim()) return;
    setCustomTasks(addCustomTask(newTaskText, newTaskDomain));
    setNewTaskText('');
  }

  function handleRemoveTask(id: string) {
    setCustomTasks(removeCustomTask(id));
  }

  function updateA11y(patch: Partial<AccessibilityPrefs>) {
    setA11y(prev => {
      const next = { ...prev, ...patch };
      saveA11y(next);
      applyA11y(next);
      return next;
    });
  }

  const consented = !!family?.consent;
  const child = activeChild(family);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 13 }, (_, i) => thisYear - i);

  function handleConsent() {
    if (!agreeChecked) return;
    setFamily(recordConsent('checkbox'));
  }

  function handleAddChild() {
    if (!nickname.trim()) { setFormError('Please enter a first name or nickname.'); return; }
    if (!birthMonth || !birthYear) { setFormError('Please pick the birth month and year.'); return; }
    setFamily(addChild({ nickname, birthYear, birthMonth, avatar }));
    setFormError('');
    setNickname(''); setBirthMonth(0); setBirthYear(0); setAvatar(AVATARS[0]);
    setShowAddChild(false);
  }

  function handleSwitchChild(childId: string) {
    setFamily(setActiveChild(childId));
  }

  async function handleDeleteChild() {
    if (!child) return;
    await deleteChildAndData(child.id);
    setFamily(loadFamily());
    setConfirmingChild(false);
    setShowData(false);
    setDeletedMsg('Child profile and every piece of stored data were permanently deleted from this device.');
  }

  async function handleDeleteAll() {
    await deleteEverything();
    setFamily(null);
    setConfirmingAll(false);
    setShowData(false);
    setDeletedMsg('The whole account and all data were permanently deleted from this device.');
  }

  if (!loaded) return null;

  // First-time setup: until the active child has finished the adventure
  // check, this page is step 2 of the four setup steps, so it shows the
  // step strip and a clear "next step" button instead of looking like a
  // settings page with no way forward.
  const onboarding = assessmentLoaded && !assessment.assessmentCompleted;

  return (
    <main className="min-h-screen pb-24" style={{ background: theme.background }}>
      <div className="max-w-md sm:max-w-xl lg:max-w-3xl mx-auto px-4">

        <div className="flex items-center justify-between gap-2 pt-5 pb-1">
          {onboarding ? <BackButton href="/story" label="Story" /> : <BackButton href="/play" label="Map" />}
          <h1 className={`text-xl sm:text-2xl font-extrabold text-center ${theme.title}`}>👨‍👩‍👧 Parent Zone</h1>
          <ThemeToggle />
        </div>
        <p className={`text-sm text-center mb-4 ${theme.subtitle}`}>
          For grown-ups: progress, settings and privacy.
        </p>

        {onboarding && (
          <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` }}>
            <StepGuide step={2} tone={bright ? 'light' : 'dark'} />
          </div>
        )}

        {deletedMsg && (
          <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: '#ECFDF5', border: '2px solid #34D399' }}>
            <p className="text-sm font-bold text-emerald-800">✅ {deletedMsg}</p>
          </div>
        )}

        {/* ── STEP 1: Consent ── */}
        {!consented && (
          <div className="rounded-3xl p-5" style={{ background: theme.surface }}>
            <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700 mb-1">Part 1 of 2 · Privacy</p>
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Before we begin</h2>
            <p className="text-sm text-gray-600 mb-3">
              Kailia&apos;s Story is made for children, so <strong>you</strong> — the parent or
              guardian — are in charge of the account. Please read what the app stores about
              your child and agree before anything is saved.
            </p>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">What we collect &amp; why</p>
            <div className="space-y-2 mb-3">
              {COLLECTED.map(([e, t]) => (
                <div key={t} className="flex items-start gap-2 rounded-xl p-2.5" style={{ background: '#F8FAFC' }}>
                  <span className="text-xl" style={{ flexShrink: 0 }}>{e}</span>
                  <p className="text-xs text-gray-700">{t}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-2.5 mb-3" style={{ background: '#FEF3C7' }}>
              <p className="text-xs text-amber-900">
                <strong>Where it lives:</strong> only on this device. Nothing is uploaded, sold, or
                shared. <strong>Never collected:</strong> audio, video, location, email, or a last
                name. The one exception is Printable Worksheets, where a parent may optionally
                photograph a completed paper sheet — that photo stays on this device only and has
                its own separate consent, asked the first time you try it. <strong>How long:</strong>{' '}
                only while the profile exists — deleting it erases everything (within 30 days on
                any future servers).
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Full details: <Link href="/privacy" className="underline font-semibold">Privacy Policy</Link> ·{' '}
              <Link href="/retention" className="underline font-semibold">Data Retention Policy</Link>{' '}
              (both drafts, pending legal review).
            </p>

            <label className="flex items-start gap-2.5 rounded-xl p-3 cursor-pointer" style={{ background: '#EFF6FF', border: '2px solid #93C5FD' }}>
              <input type="checkbox" checked={agreeChecked} onChange={e => setAgreeChecked(e.target.checked)}
                className="mt-0.5 w-5 h-5" />
              <span className="text-sm text-gray-800 font-semibold">
                I am this child&apos;s parent or legal guardian, I have read the notice above, and I
                agree to the collection described.
              </span>
            </label>
            <button onClick={handleConsent} disabled={!agreeChecked}
              className="mt-3 w-full py-3.5 rounded-full text-lg font-extrabold text-white transition-all"
              style={{ background: agreeChecked ? '#2563EB' : '#CBD5E1' }}>
              I agree — create my account
            </button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              The date and time of your agreement are saved. A stronger verification step (such as
              card verification) will be added with the payment system.
            </p>
          </div>
        )}

        {/* ── Who we're looking at: the active child, with switch/add ── */}
        {consented && family && child && (
          <div className="rounded-3xl p-4 mb-4" style={{ background: theme.surface }}>
            <div className="flex items-center gap-3">
              <span className="text-5xl" aria-hidden="true">{child.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-extrabold text-gray-800 truncate">{child.nickname}</p>
                <p className="text-sm text-gray-500">{ageLabel(child)} · born {MONTHS[child.birthMonth - 1]} {child.birthYear}</p>
              </div>
            </div>
            {/* Families can have more than one child: tap to switch, or add a sibling */}
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
              {family.children.length > 1 && family.children.map(c => (
                <button key={c.id} onClick={() => handleSwitchChild(c.id)} aria-pressed={c.id === family.activeChildId}
                  className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-full text-sm font-extrabold transition-transform active:scale-95"
                  style={{ background: c.id === family.activeChildId ? '#7C3AED' : '#F1F5F9', color: c.id === family.activeChildId ? 'white' : '#334155' }}>
                  <span>{c.avatar}</span> {c.nickname}
                </button>
              ))}
              <button onClick={() => setShowAddChild(true)}
                className="flex items-center gap-1 min-h-[40px] px-3 rounded-full text-sm font-bold text-slate-600"
                style={{ border: '1.5px dashed #CBD5E1' }}>
                + Add a child
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Add child profile (always for the first child; a
            toggled form for adding a sibling afterward) ── */}
        {consented && (!child || showAddChild) && (
          <div className="rounded-3xl p-5 mb-4" style={{ background: theme.surface }}>
            {!child && <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700 mb-1">Part 2 of 2 · Your child</p>}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-extrabold text-gray-800">{child ? 'Add another child' : 'Add your child'}</h2>
              {child && (
                <button onClick={() => setShowAddChild(false)} className="text-xs font-bold text-gray-400">Cancel</button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Just three things — a first name or nickname, birth month/year (so quests match your
              child&apos;s development), and a cartoon avatar. Nothing else, ever.
            </p>
            <label className="block text-sm font-bold text-gray-700 mb-1">First name or nickname</label>
            <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setFormError(''); }}
              placeholder="e.g. Mika" maxLength={30}
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-gray-800 mb-3 focus:outline-none focus:border-blue-400" />
            <label className="block text-sm font-bold text-gray-700 mb-1">Birth month &amp; year</label>
            <div className="flex gap-2 mb-3">
              <select value={birthMonth} onChange={e => { setBirthMonth(+e.target.value); setFormError(''); }}
                className="flex-1 border-2 border-slate-200 rounded-2xl px-3 py-2.5 text-gray-800 bg-white">
                <option value={0}>Month…</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={birthYear} onChange={e => { setBirthYear(+e.target.value); setFormError(''); }}
                className="flex-1 border-2 border-slate-200 rounded-2xl px-3 py-2.5 text-gray-800 bg-white">
                <option value={0}>Year…</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Pick an avatar</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} className="w-12 h-12 rounded-2xl text-2xl transition-transform hover:scale-110"
                  style={{ background: avatar === a ? '#DBEAFE' : '#F8FAFC', border: avatar === a ? '2.5px solid #2563EB' : '2px solid #E2E8F0' }}>
                  {a}
                </button>
              ))}
            </div>
            {formError && <p className="text-sm font-bold text-rose-600 mb-2">{formError}</p>}
            <button onClick={handleAddChild}
              className="w-full py-3.5 rounded-full text-lg font-extrabold text-white" style={{ background: '#2563EB' }}>
              Create profile
            </button>
          </div>
        )}

        {consented && child && family && (
          <>
            {/* The one obvious way forward during first-time setup */}
            {onboarding && !showAddChild && (
              <Link href="/setup"
                className="block rounded-3xl p-5 mb-4 text-center shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)' }}>
                <p className="text-xs font-extrabold uppercase tracking-wide text-violet-100">All set! Next step</p>
                <p className="text-xl font-extrabold text-white mt-0.5">🧭 Start {child.nickname}&apos;s adventure check →</p>
                <p className="text-sm text-violet-100 mt-1">A few minutes of play so Kailia can pick the right path.</p>
              </Link>
            )}

            {/* A quiet preview of what the parent gets later, so Results and
                the Progress report aren't a surprise. Not tappable: the
                start button above stays the one main action. */}
            {onboarding && !showAddChild && (
              <div className="rounded-3xl p-4 mb-4" aria-label="Unlocks after the adventure check"
                style={{ background: theme.panelBg, border: `1.5px dashed ${theme.panelBorder}` }}>
                <p className={`text-sm font-extrabold mb-2 ${theme.subtitle}`}>✨ What you&apos;ll get</p>
                <ul className={`space-y-1.5 text-sm ${theme.subtitle}`} style={{ opacity: 0.85 }}>
                  <li>🌟 <strong>Results:</strong> see how {child.nickname} is doing in each skill</li>
                  <li>📋 <strong>Progress report:</strong> a printable summary for {child.nickname}&apos;s therapist or teacher</li>
                </ul>
                <p className={`text-xs font-bold mt-3 ${theme.subtitle}`} style={{ opacity: 0.7 }}>🔒 Unlocks after the adventure check</p>
              </div>
            )}

            {/* The two things parents come here for most, as big tiles */}
            {!onboarding && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Link href="/results" className="rounded-3xl p-4 transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ background: theme.surface }}>
                  <span className="text-3xl" aria-hidden="true">🌟</span>
                  <p className="font-extrabold text-gray-800 mt-1 leading-tight">Results</p>
                  <p className="text-sm text-gray-500 leading-snug">How {child.nickname} is doing</p>
                </Link>
                <Link href="/progress" className="rounded-3xl p-4 transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ background: theme.surface }}>
                  <span className="text-3xl" aria-hidden="true">📋</span>
                  <p className="font-extrabold text-gray-800 mt-1 leading-tight">Progress report</p>
                  <p className="text-sm text-gray-500 leading-snug">Print or share with a therapist or teacher</p>
                </Link>
              </div>
            )}

            <p className={`text-xs font-extrabold uppercase tracking-wide mb-2 px-1 ${theme.subtitle}`}>More options</p>

            {/* Custom Quests — a parent's own practice goals, woven into
                Noel's daily quest screen alongside the built-in library. */}
            <Section icon="🎯" title="Your own practice goals"
              hint={`Add something for ${child.nickname} to practice in Today's Quests`}>
              <p className="text-sm text-gray-600 mb-3">
                Is there something you or {child.nickname}&apos;s therapist or teacher want to work on,
                like saying &ldquo;thank you&rdquo; or buttoning a coat? Write it here and Noel will add
                it to Today&apos;s Quests, where you can tap Did it, Tried with help or Not yet.
              </p>

              {customTasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {customTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: '#F1F5F9' }}>
                      <span className="text-lg">{DOMAIN_META[t.domain].emoji}</span>
                      <p className="flex-1 text-sm text-gray-800 font-semibold">{t.text}</p>
                      <button onClick={() => handleRemoveTask(t.id)} className="min-h-[36px] px-2 text-sm font-bold text-rose-600">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <label htmlFor="goal-text" className="block text-sm font-bold text-gray-700 mb-1">1. What should {child.nickname} practice?</label>
              <input id="goal-text" type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                placeholder={`e.g. "Say thank you at dinner"`} maxLength={80}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-gray-800 bg-white mb-3 focus:outline-none focus:border-violet-400" />
              <label htmlFor="goal-area" className="block text-sm font-bold text-gray-700 mb-1">2. Which skill is it?</label>
              <select id="goal-area" value={newTaskDomain} onChange={e => setNewTaskDomain(e.target.value as ActivityDomain)}
                className="w-full border-2 border-slate-200 rounded-2xl px-3 py-2.5 text-gray-800 bg-white mb-3">
                {(Object.keys(DOMAIN_META) as ActivityDomain[]).map(d => (
                  <option key={d} value={d}>{DOMAIN_META[d].emoji} {DOMAIN_META[d].label}</option>
                ))}
              </select>
              <button onClick={handleAddTask} disabled={!newTaskText.trim()}
                className="w-full min-h-[48px] rounded-full font-extrabold text-white transition-colors"
                style={{ background: newTaskText.trim() ? '#7C3AED' : '#CBD5E1' }}>
                Add goal
              </button>
            </Section>
          </>
        )}

        <Section icon="♿" title="Display & accessibility" hint="Text size, motion, sound and colors">
          <div className="mb-3">
            <p className={`text-xs font-bold mb-1.5 text-gray-700`}>Text size</p>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <button key={size} onClick={() => updateA11y({ textSize: size })}
                  className="flex-1 min-h-[44px] rounded-xl text-sm font-extrabold transition-transform hover:scale-105"
                  style={{ background: a11y.textSize === size ? '#7C3AED' : '#F1F5F9', color: a11y.textSize === size ? 'white' : '#1E293B' }}>
                  {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-xl p-3 min-h-[48px] mb-2 cursor-pointer" style={{ background: '#F1F5F9' }}>
            <span className={`text-sm font-semibold text-gray-700`}>🎬 Reduce motion &amp; animation</span>
            <input type="checkbox" checked={a11y.reducedMotion} onChange={e => updateA11y({ reducedMotion: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-3 min-h-[48px] mb-2 cursor-pointer" style={{ background: '#F1F5F9' }}>
            <span className={`text-sm font-semibold text-gray-700`}>🔇 Reduce sound effects</span>
            <input type="checkbox" checked={a11y.reducedSound} onChange={e => updateA11y({ reducedSound: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-3 min-h-[48px] mb-2 cursor-pointer" style={{ background: '#F1F5F9' }}>
            <span className={`text-sm font-semibold text-gray-700`}>📖 Dyslexia-friendly text spacing</span>
            <input type="checkbox" checked={a11y.dyslexiaFriendly} onChange={e => updateA11y({ dyslexiaFriendly: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-3 min-h-[48px] cursor-pointer" style={{ background: '#F1F5F9' }}>
            <span className={`text-sm font-semibold text-gray-700`}>👁️ Colorblind-safe colors</span>
            <input type="checkbox" checked={a11y.colorblindSafe} onChange={e => updateA11y({ colorblindSafe: e.target.checked })} className="w-5 h-5" />
          </label>
          <p className={`text-xs mt-2 text-gray-500`}>
            These settings are saved on this device only — they&apos;re not part of your child&apos;s data.
          </p>
        </Section>

        {/* Privacy & data — parental rights (COPPA rule 7): view everything
            stored, delete the child, delete the account. Always reachable
            once an account exists, even after the child profile is gone. */}
        {consented && family && (
          <Section icon="🔒" title="Privacy & your data" hint="See or delete what's stored on this device">
            {family.consent && (
              <p className="text-sm text-gray-600 mb-3">
                ✅ You agreed to the privacy notice on {new Date(family.consent.agreedAt).toLocaleDateString()}.
                Everything stays on this device only.
              </p>
            )}

            {child && (
              <>
                <button onClick={() => { setInventory(childDataInventory()); setShowData(s => !s); }}
                  className="w-full min-h-[48px] rounded-full font-extrabold text-white mb-3" style={{ background: '#0891B2' }}>
                  {showData ? 'Hide stored data ▴' : `🔎 View everything stored about ${child.nickname}`}
                </button>
                {showData && (
                  <div className="mb-4 space-y-3 slide-up">
                    {inventory.map(sec => (
                      <div key={sec.label}>
                        <p className="text-sm font-extrabold text-gray-700 mb-1">{sec.label}</p>
                        <ul className="space-y-1">
                          {sec.items.map((it, i) => (
                            <li key={i} className="text-xs text-gray-600 rounded-lg px-2.5 py-1.5" style={{ background: '#F1F5F9' }}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-500">
                      Consent record: {new Date(family.consent!.agreedAt).toLocaleString()} · method: {family.consent!.method} · notice version {POLICY_VERSION}
                    </p>
                  </div>
                )}

                {!confirmingChild ? (
                  <button onClick={() => setConfirmingChild(true)}
                    className="w-full min-h-[48px] rounded-full font-bold text-rose-700 mb-3" style={{ border: '2px solid #FCA5A5' }}>
                    Delete {child.nickname}&apos;s profile and all data
                  </button>
                ) : (
                  <div className="rounded-2xl p-3 mb-3" style={{ background: '#FEF2F2', border: '2px solid #F87171' }}>
                    <p className="text-sm font-bold text-rose-800 mb-2">
                      This permanently erases {child.nickname}&apos;s profile, assessment, game progress and
                      every measurement. It cannot be undone. Are you sure?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleDeleteChild} className="flex-1 py-2.5 rounded-full font-extrabold text-white" style={{ background: '#DC2626' }}>
                        Yes, permanently delete
                      </button>
                      <button onClick={() => setConfirmingChild(false)} className="flex-1 py-2.5 rounded-full font-bold text-gray-600" style={{ border: '2px solid #E2E8F0' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!confirmingAll ? (
              <button onClick={() => setConfirmingAll(true)}
                className="w-full min-h-[48px] rounded-full font-bold text-rose-700" style={{ border: '2px solid #FCA5A5' }}>
                Delete my entire account and all data
              </button>
            ) : (
              <div className="rounded-2xl p-3" style={{ background: '#FEF2F2', border: '2px solid #F87171' }}>
                <p className="text-sm font-bold text-rose-800 mb-2">
                  This erases the whole account: your consent record, any child profile, and every
                  piece of data. It cannot be undone. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAll} className="flex-1 py-2.5 rounded-full font-extrabold text-white" style={{ background: '#DC2626' }}>
                    Yes, delete everything
                  </button>
                  <button onClick={() => setConfirmingAll(false)} className="flex-1 py-2.5 rounded-full font-bold text-gray-600" style={{ border: '2px solid #E2E8F0' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              <Link href="/privacy" className="underline font-semibold">Privacy Policy</Link> ·{' '}
              <Link href="/retention" className="underline font-semibold">Data Retention Policy</Link>
            </p>
          </Section>
        )}

        {/* Developer shortcut: finishes every main-land quest so the bonus
            realms can be checked without playing all of them. Only on a
            developer's own machine (npm run dev), never in a deployed app. */}
        {DEV_TOOLS && consented && child && (
          <div className="rounded-3xl p-4 mt-4 text-center" style={{ background: '#FEF3C7', border: '2px dashed #D97706' }}>
            <p className="text-xs font-bold text-amber-900 mb-2">🚧 Developer only: unlock the bonus realms</p>
            <button onClick={() => {
                LANDS.forEach(land => land.quests.forEach(q => recordQuestPlay(land.id, q.href)));
                setDeletedMsg('Bonus realms unlocked — check the world map!');
                setTimeout(() => setDeletedMsg(''), 4000);
              }}
              className="px-5 py-2.5 rounded-full font-extrabold text-white text-sm" style={{ background: '#D97706' }}>
              Finish all 6 main lands
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <PandaSprite size={46} expression="happy" />
          <p className={`text-sm max-w-[240px] ${theme.subtitle}`}>
            Noel keeps the adventure fun. You stay in charge of the data.
          </p>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
