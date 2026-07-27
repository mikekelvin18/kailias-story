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

// ── Parent Zone ──
// Consent first, then a minimal child profile, then full parental rights:
// view every piece of stored data, delete the child profile, delete it all.

const AVATARS = ['🦊', '🐰', '🐻', '🦉', '🐸', '🦄', '🐢', '🐝'];
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

  return (
    <main className="min-h-screen pb-24" style={{ background: theme.background }}>
      <div className="max-w-md sm:max-w-xl lg:max-w-3xl mx-auto px-4">

        <div className="flex items-center justify-between pt-6 pb-1">
          <Link href="/" className={`text-sm font-bold ${theme.link}`}>← Home</Link>
          <h1 className={`text-2xl font-extrabold ${theme.title}`}>👨‍👩‍👧 Parent Zone</h1>
          <ThemeToggle />
        </div>
        <p className={`text-xs text-center mb-5 ${theme.subtitle}`}>
          For grown-ups: your account, your child&apos;s data, your controls.
        </p>

        {/* ── Accessibility settings — a device display preference, not
            child data, so it's always available regardless of consent ── */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` }}>
          <h2 className={`text-sm font-extrabold mb-3 ${theme.title}`}>♿ Accessibility</h2>

          <div className="mb-3">
            <p className={`text-xs font-bold mb-1.5 ${theme.subtitle}`}>Text size</p>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <button key={size} onClick={() => updateA11y({ textSize: size })}
                  className="flex-1 py-2 rounded-xl text-xs font-extrabold transition-transform hover:scale-105"
                  style={{ background: a11y.textSize === size ? '#7C3AED' : theme.cardBg, color: a11y.textSize === size ? 'white' : (bright ? '#1e1b4b' : 'white') }}>
                  {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 rounded-xl p-2.5 mb-2 cursor-pointer" style={{ background: theme.cardBg }}>
            <span className={`text-xs font-semibold ${theme.subtitle}`}>🎬 Reduce motion &amp; animation</span>
            <input type="checkbox" checked={a11y.reducedMotion} onChange={e => updateA11y({ reducedMotion: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-2.5 mb-2 cursor-pointer" style={{ background: theme.cardBg }}>
            <span className={`text-xs font-semibold ${theme.subtitle}`}>🔇 Reduce sound effects</span>
            <input type="checkbox" checked={a11y.reducedSound} onChange={e => updateA11y({ reducedSound: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-2.5 mb-2 cursor-pointer" style={{ background: theme.cardBg }}>
            <span className={`text-xs font-semibold ${theme.subtitle}`}>📖 Dyslexia-friendly text spacing</span>
            <input type="checkbox" checked={a11y.dyslexiaFriendly} onChange={e => updateA11y({ dyslexiaFriendly: e.target.checked })} className="w-5 h-5" />
          </label>

          <label className="flex items-center justify-between gap-2 rounded-xl p-2.5 cursor-pointer" style={{ background: theme.cardBg }}>
            <span className={`text-xs font-semibold ${theme.subtitle}`}>👁️ Colorblind-safe colors</span>
            <input type="checkbox" checked={a11y.colorblindSafe} onChange={e => updateA11y({ colorblindSafe: e.target.checked })} className="w-5 h-5" />
          </label>
          <p className={`text-[10px] mt-2 ${theme.subtitle}`} style={{ opacity: 0.75 }}>
            These settings are saved on this device only — they&apos;re not part of your child&apos;s data.
          </p>
        </div>

        {deletedMsg && (
          <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: '#ECFDF5', border: '2px solid #34D399' }}>
            <p className="text-sm font-bold text-emerald-800">✅ {deletedMsg}</p>
          </div>
        )}

        {/* ── STEP 1: Consent ── */}
        {!consented && (
          <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.97)' }}>
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

        {/* ── Child switcher — families can have more than one child; tap
            an avatar to make it active, or add another sibling ── */}
        {consented && family && family.children.length > 0 && (
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-2 flex-wrap" style={{ background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` }}>
            {family.children.map(c => (
              <button key={c.id} onClick={() => handleSwitchChild(c.id)}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-transform hover:scale-105"
                style={{ background: c.id === family.activeChildId ? '#7C3AED' : theme.cardBg }}>
                <span className="text-2xl">{c.avatar}</span>
                <span className={`text-[10px] font-extrabold ${c.id === family.activeChildId ? 'text-white' : theme.subtitle}`}>{c.nickname}</span>
              </button>
            ))}
            <button onClick={() => setShowAddChild(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-transform hover:scale-105"
              style={{ background: theme.cardBg, border: `1.5px dashed ${theme.panelBorder}` }}>
              <span className={`text-2xl ${theme.subtitle}`}>➕</span>
              <span className={`text-[10px] font-extrabold ${theme.subtitle}`}>Add</span>
            </button>
          </div>
        )}

        {/* ── STEP 2: Add child profile (always for the first child; a
            toggled form for adding a sibling afterward) ── */}
        {consented && (!child || showAddChild) && (
          <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
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

        {/* ── STEP 3: Manage ── */}
        {consented && child && family && (
          <>
            <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{child.avatar}</span>
                <div>
                  <p className="text-xl font-extrabold text-gray-800">{child.nickname}</p>
                  <p className="text-xs text-gray-500">
                    Born {MONTHS[child.birthMonth - 1]} {child.birthYear} · profile created {new Date(child.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="rounded-xl p-2.5 mt-3" style={{ background: '#ECFDF5' }}>
                <p className="text-[11px] text-emerald-800">
                  ✅ Consent on file: agreed {new Date(family.consent!.agreedAt).toLocaleString()} ·
                  method: {family.consent!.method} · notice version {POLICY_VERSION}
                </p>
              </div>
            </div>

            {/* Custom Quests — a parent's own practice goals, woven into
                Noel's daily quest screen alongside the built-in library. */}
            <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <h2 className="text-lg font-extrabold text-gray-800 mb-1">📝 {child.nickname}&apos;s Custom Quests</h2>
              <p className="text-xs text-gray-500 mb-3">
                Add your own goal — an OT/IEP goal, a manners practice, anything specific to{' '}
                {child.nickname} — and Noel will fold it into the daily quest screen with the same
                Did it / Tried with help / Not yet report.
              </p>

              {customTasks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {customTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: '#F8FAFC' }}>
                      <span className="text-lg">{DOMAIN_META[t.domain].emoji}</span>
                      <p className="flex-1 text-sm text-gray-800 font-semibold">{t.text}</p>
                      <button onClick={() => handleRemoveTask(t.id)} className="text-xs font-bold text-rose-500">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block text-xs font-bold text-gray-700 mb-1">New goal</label>
              <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                placeholder={`e.g. "Practice saying thank you"`} maxLength={80}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-gray-800 mb-2 focus:outline-none focus:border-blue-400" />
              <div className="flex gap-2">
                <select value={newTaskDomain} onChange={e => setNewTaskDomain(e.target.value as ActivityDomain)}
                  className="flex-1 border-2 border-slate-200 rounded-2xl px-3 py-2.5 text-gray-800 bg-white text-sm">
                  {(Object.keys(DOMAIN_META) as ActivityDomain[]).map(d => (
                    <option key={d} value={d}>{DOMAIN_META[d].emoji} {DOMAIN_META[d].label}</option>
                  ))}
                </select>
                <button onClick={handleAddTask}
                  className="px-5 py-2.5 rounded-2xl font-extrabold text-white flex-shrink-0" style={{ background: '#2563EB' }}>
                  Add
                </button>
              </div>
            </div>

            {/* View data */}
            <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <button onClick={() => { setInventory(childDataInventory()); setShowData(s => !s); }}
                className="w-full py-3 rounded-full font-extrabold text-white" style={{ background: '#0891B2' }}>
                {showData ? 'Hide my child\'s data ▴' : '🔎 View my child\'s data'}
              </button>
              {showData && (
                <div className="mt-4 space-y-3 slide-up">
                  {inventory.map(sec => (
                    <div key={sec.label}>
                      <p className="text-sm font-extrabold text-gray-700 mb-1">{sec.label}</p>
                      <ul className="space-y-1">
                        {sec.items.map((it, i) => (
                          <li key={i} className="text-xs text-gray-600 rounded-lg px-2.5 py-1.5" style={{ background: '#F8FAFC' }}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400">
                    This is every piece of data stored about {child.nickname} — all of it on this device only.
                  </p>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.97)', border: '2px solid #FECACA' }}>
              <h2 className="text-sm font-extrabold text-rose-700 mb-3">Delete controls</h2>
              {!confirmingChild ? (
                <button onClick={() => setConfirmingChild(true)}
                  className="w-full py-3 rounded-full font-bold text-rose-700 mb-3" style={{ border: '2px solid #FCA5A5' }}>
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
            </div>
          </>
        )}

        {/* Account deletion — always available once an account exists,
            even after the child profile is gone (full consent withdrawal) */}
        {consented && (
          <div className="rounded-3xl p-5 mt-4" style={{ background: 'rgba(255,255,255,0.97)', border: '2px solid #FECACA' }}>
            {!confirmingAll ? (
              <button onClick={() => setConfirmingAll(true)}
                className="w-full py-3 rounded-full font-bold text-rose-700" style={{ border: '2px solid #FCA5A5' }}>
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
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <PandaSprite size={46} expression="happy" />
          <p className="text-slate-400 text-xs max-w-[240px]">
            Noel keeps the adventure fun — you stay in charge of the data.
          </p>
        </div>
        <p className="text-center text-xs mt-4">
          <Link href="/privacy" className="text-sky-300 underline mr-3">Privacy Policy</Link>
          <Link href="/retention" className="text-sky-300 underline">Data Retention Policy</Link>
        </p>
      </div>
      <BottomNav />
    </main>
  );
}
