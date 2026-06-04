'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaAvatar from '@/components/KailiaAvatar';

// ageKey → display label, numeric value, group
const AGE_GROUPS = [
  {
    groupLabel: '🍼 Under 1 Year',
    color: '#EC4899',
    light: '#FDF2F8',
    border: '#F9A8D4',
    ages: [{ key: '0.5', label: '6–11 mo' }],
  },
  {
    groupLabel: '👶 1 Year Old',
    color: '#F97316',
    light: '#FFF7ED',
    border: '#FED7AA',
    ages: [{ key: '1', label: '12–23 mo' }],
  },
  {
    groupLabel: '🌸 Preschool (2–4)',
    color: '#F59E0B',
    light: '#FFFBEB',
    border: '#FDE68A',
    ages: [
      { key: '2', label: '2' },
      { key: '3', label: '3' },
      { key: '4', label: '4' },
    ],
  },
  {
    groupLabel: '🎒 School Age (5–12)',
    color: '#7C3AED',
    light: '#F5F3FF',
    border: '#DDD6FE',
    ages: [
      { key: '5', label: '5' }, { key: '6', label: '6' },
      { key: '7', label: '7' }, { key: '8', label: '8' },
      { key: '9', label: '9' }, { key: '10', label: '10' },
      { key: '11', label: '11' }, { key: '12', label: '12' },
    ],
  },
];

function getGroupForKey(key: string) {
  const num = parseFloat(key);
  if (num === 0.5) return 'infant';
  if (num === 1)   return 'toddler';
  if (num <= 4)    return 'preschool';
  return 'schoolAge';
}

function getColorForKey(key: string) {
  const group = getGroupForKey(key);
  if (group === 'infant')    return '#EC4899';
  if (group === 'toddler')   return '#F97316';
  if (group === 'preschool') return '#F59E0B';
  return '#7C3AED';
}

export default function SetupPage() {
  const [name, setName]             = useState('');
  const [ageKey, setAgeKey]         = useState('');
  const [preferParent, setPreferParent] = useState(false);
  const [error, setError]           = useState('');
  const { setChildInfo, setAssessmentType } = useAssessment();
  const router = useRouter();

  const ageNum   = parseFloat(ageKey);
  const group    = ageKey ? getGroupForKey(ageKey) : null;
  const isYoung  = group === 'infant' || group === 'toddler' || group === 'preschool';
  const willUseChecklist = isYoung || preferParent;
  const activeColor = ageKey ? getColorForKey(ageKey) : '#7C3AED';

  const handleStart = () => {
    if (!name.trim())   { setError("Please enter your child's first name."); return; }
    if (!ageKey)        { setError('Please select your child\'s age.'); return; }
    setChildInfo(name.trim(), ageNum);
    const type = willUseChecklist ? 'checklist' : 'games';
    setAssessmentType(type);
    router.push(type === 'checklist' ? '/assessment/checklist' : '/assessment/games');
  };

  const pathLabel = () => {
    if (!ageKey) return null;
    if (group === 'infant')    return { icon: '📋', text: 'Parent Questionnaire — Infant (6–11 months)', note: 'You answer on behalf of your baby. Takes about 3 minutes.', color: '#EC4899' };
    if (group === 'toddler')   return { icon: '📋', text: 'Parent Questionnaire — Toddler (12–23 months)', note: 'You answer on behalf of your toddler. Takes about 3 minutes.', color: '#F97316' };
    if (group === 'preschool') return { icon: '📋', text: 'Parent Questionnaire — Preschool (2–4 years)', note: 'You answer for your child. Takes about 4 minutes.', color: '#F59E0B' };
    if (preferParent)          return { icon: '📋', text: 'Parent Questionnaire — School Age (5–12 years)', note: 'You answer on behalf of your child.', color: '#059669' };
    return { icon: '🎮', text: 'Fun Placement Games — School Age (5–12 years)', note: 'Your child plays 4 short mini-games with Kailia. Takes about 8 minutes.', color: '#7C3AED' };
  };

  const path = pathLabel();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 50%, #667EEA 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['⭐','🌟','✨','💫','🎈','🎀'].map((s, i) => (
          <span key={i} className="absolute float" style={{ left: `${(i*19+3)%92}%`, top: `${(i*29+5)%85}%`, fontSize: 24, animationDelay: `${i*0.4}s`, opacity: 0.6 }}>
            {s}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="float inline-block mb-3"><KailiaAvatar size={80} /></div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-md mb-1">Tell Kailia About You!</h1>
          <p className="text-teal-100 text-lg">So she can find the perfect adventure for your child.</p>
        </div>

        <div className="rounded-3xl p-7 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>

          {/* Name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold text-base mb-2">🌸 Child's First Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Emma"
              className="w-full border-2 border-purple-200 rounded-2xl px-5 py-3 text-lg text-gray-800 focus:outline-none focus:border-purple-500 transition-colors"
              style={{ background: '#F8F0FF' }}
            />
          </div>

          {/* Age — 4 color-coded groups */}
          <div className="mb-5">
            <label className="block text-gray-700 font-bold text-base mb-3">🎂 Child's Age</label>
            <div className="space-y-3">
              {AGE_GROUPS.map(grp => (
                <div key={grp.groupLabel} className="rounded-2xl p-3" style={{ background: grp.light, border: `1.5px solid ${grp.border}` }}>
                  <p className="text-xs font-bold mb-2" style={{ color: grp.color }}>{grp.groupLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {grp.ages.map(a => (
                      <button
                        key={a.key}
                        onClick={() => { setAgeKey(a.key); setError(''); }}
                        className="px-4 py-2 rounded-full font-bold text-sm transition-all hover:scale-105"
                        style={{
                          background: ageKey === a.key ? grp.color : 'white',
                          color: ageKey === a.key ? 'white' : grp.color,
                          border: `2px solid ${grp.color}`,
                          minWidth: 52,
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live path preview */}
          {path && (
            <div
              className="mb-5 rounded-2xl p-4 bounce-in"
              style={{ background: `${path.color}15`, border: `2px solid ${path.color}` }}
            >
              <p className="font-bold text-sm" style={{ color: path.color }}>
                {path.icon} {path.text}
              </p>
              <p className="text-xs mt-1 text-gray-500">{path.note}</p>
            </div>
          )}

          {/* Parent preference — only visible for school age */}
          {group === 'schoolAge' && (
            <div
              className="mb-5 rounded-2xl p-4 cursor-pointer transition-all"
              style={{
                background: preferParent ? '#EDE9FE' : '#F9FAFB',
                border: preferParent ? '2px solid #7C3AED' : '2px solid #E5E7EB',
              }}
              onClick={() => setPreferParent(p => !p)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{preferParent ? '✅' : '⬜'}</span>
                <div>
                  <p className="font-bold text-gray-700 text-sm">My child prefers parent help</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use a parent questionnaire instead of the child games. Great for shy kids or kids who need extra support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl p-3 text-red-700 font-semibold text-sm" style={{ background: '#FEE2E2' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl font-extrabold text-xl text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${activeColor}, #EC4899)` }}
          >
            Start Kailia's Adventure! ✨
          </button>
        </div>
      </div>
    </main>
  );
}
