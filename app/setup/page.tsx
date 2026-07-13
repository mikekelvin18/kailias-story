'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaAvatar from '@/components/KailiaAvatar';
import PandaSprite from '@/components/characters/PandaSprite';
import { ChildProfile, activeChild, childAgeYears } from '@/lib/family';

// COPPA: children never type personal information anywhere in the app.
// The child's nickname and birth month/year come from the profile the
// PARENT created in the Parent Zone (/family) after giving consent.

function getGroupForAge(age: number) {
  if (age === 0.5) return 'infant';
  if (age === 1)   return 'toddler';
  if (age <= 4)    return 'preschool';
  return 'schoolAge';
}

function getColorForGroup(group: string) {
  if (group === 'infant')    return '#EC4899';
  if (group === 'toddler')   return '#F97316';
  if (group === 'preschool') return '#F59E0B';
  return '#7C3AED';
}

export default function SetupPage() {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [preferParent, setPreferParent] = useState(false);
  const { setChildInfo, setAssessmentType } = useAssessment();
  const router = useRouter();

  useEffect(() => { setChild(activeChild()); setLoaded(true); }, []);

  const ageNum = child ? Math.min(childAgeYears(child), 12) : 0;
  const group = child ? getGroupForAge(ageNum) : null;
  const isYoung = group === 'infant' || group === 'toddler' || group === 'preschool';
  const willUseChecklist = isYoung || preferParent;
  const activeColor = group ? getColorForGroup(group) : '#7C3AED';

  const handleStart = () => {
    if (!child) return;
    setChildInfo(child.nickname, ageNum);
    const type = willUseChecklist ? 'checklist' : 'games';
    setAssessmentType(type);
    router.push(type === 'checklist' ? '/assessment/checklist' : '/assessment/games');
  };

  const pathLabel = () => {
    if (!group) return null;
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
          <h1 className="text-4xl font-extrabold text-white drop-shadow-md mb-1">Ready for the Adventure?</h1>
          <p className="text-teal-100 text-lg">Kailia will pick the perfect path for your child.</p>
        </div>

        {loaded && !child && (
          /* No profile yet → grown-ups must set up first; the child types nothing */
          <div className="rounded-3xl p-7 shadow-2xl text-center" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <PandaSprite size={90} expression="thinking" className="mx-auto mb-2" />
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">Grown-ups go first!</h2>
            <p className="text-sm text-gray-600 mb-5">
              Before the adventure starts, a parent or guardian creates the family account and a
              little profile — it only takes a minute, and it keeps your child&apos;s information
              safe and in your hands.
            </p>
            <Link href="/family"
              className="inline-block px-10 py-4 rounded-full text-lg font-extrabold text-white shadow-xl transition-transform hover:scale-105"
              style={{ background: '#2563EB' }}>
              👨‍👩‍👧 Go to the Parent Zone
            </Link>
          </div>
        )}

        {loaded && child && (
          <div className="rounded-3xl p-7 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>

            {/* The profile the parent created — nothing for the child to type */}
            <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: '#F5F3FF', border: '2px solid #DDD6FE' }}>
              <span className="text-5xl">{child.avatar}</span>
              <div className="flex-1">
                <p className="text-xl font-extrabold text-gray-800">{child.nickname}</p>
                <p className="text-xs text-gray-500">
                  Adventure path: {group === 'infant' ? 'Infant' : group === 'toddler' ? 'Toddler' : group === 'preschool' ? 'Preschool' : 'School Age'}
                </p>
              </div>
              <Link href="/family" className="text-xs font-bold text-purple-500 underline">change</Link>
            </div>

            {/* Live path preview */}
            {path && (
              <div className="mb-5 rounded-2xl p-4 bounce-in"
                style={{ background: `${path.color}15`, border: `2px solid ${path.color}` }}>
                <p className="font-bold text-sm" style={{ color: path.color }}>
                  {path.icon} {path.text}
                </p>
                <p className="text-xs mt-1 text-gray-500">{path.note}</p>
              </div>
            )}

            {/* Parent preference — only visible for school age */}
            {group === 'schoolAge' && (
              <div className="mb-5 rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  background: preferParent ? '#EDE9FE' : '#F9FAFB',
                  border: preferParent ? '2px solid #7C3AED' : '2px solid #E5E7EB',
                }}
                onClick={() => setPreferParent(p => !p)}>
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

            <button
              onClick={handleStart}
              className="w-full py-4 rounded-2xl font-extrabold text-xl text-white shadow-lg transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${activeColor}, #EC4899)` }}>
              Start Kailia&apos;s Adventure! ✨
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
