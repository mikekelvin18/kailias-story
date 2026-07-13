'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import {
  FamilyAccount, loadFamily, recordConsent, addChild, activeChild,
  deleteChildAndData, deleteEverything, childDataInventory, DataSection, POLICY_VERSION,
} from '@/lib/family';

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

  useEffect(() => { setFamily(loadFamily()); setLoaded(true); }, []);

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
  }

  function handleDeleteChild() {
    if (!child) return;
    deleteChildAndData(child.id);
    setFamily(loadFamily());
    setConfirmingChild(false);
    setShowData(false);
    setDeletedMsg('Child profile and every piece of stored data were permanently deleted from this device.');
  }

  function handleDeleteAll() {
    deleteEverything();
    setFamily(null);
    setConfirmingAll(false);
    setShowData(false);
    setDeletedMsg('The whole account and all data were permanently deleted from this device.');
  }

  if (!loaded) return null;

  return (
    <main className="min-h-screen pb-10" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)' }}>
      <div className="max-w-md mx-auto px-4">

        <div className="flex items-center justify-between pt-6 pb-1">
          <Link href="/" className="text-sm font-bold text-sky-300">← Home</Link>
          <h1 className="text-2xl font-extrabold text-white">👨‍👩‍👧 Parent Zone</h1>
          <span className="w-12" />
        </div>
        <p className="text-slate-300 text-xs text-center mb-5">
          For grown-ups: your account, your child&apos;s data, your controls.
        </p>

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
                shared. <strong>Never collected:</strong> photos, audio, video, location, email, or a
                last name. <strong>How long:</strong> only while the profile exists — deleting it
                erases everything (within 30 days on any future servers).
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

        {/* ── STEP 2: Add child profile ── */}
        {consented && !child && (
          <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Add your child</h2>
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
    </main>
  );
}
