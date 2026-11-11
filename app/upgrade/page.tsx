'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { isPremium, isPaywallEnabled, setPremium, redeemCode } from '@/lib/premium';
import BottomNav from '@/components/BottomNav';
import BackButton from '@/components/ui/BackButton';

// ─── Kailia Plus / plan page (grown-ups) ───────────────────────────────────
// No payment processor is connected yet. While PAYWALL_ENABLED is false
// (lib/premium.ts) every family gets everything free, so this page shows a
// calm "early access" note and NO test controls. The demo unlock/reset
// buttons only ever render on a developer's own machine (`next dev`), never
// in a deployed build.

const SHOW_DEMO_CONTROLS = process.env.NODE_ENV === 'development';

const FREE = [
  'The adventure check and your child\'s results',
  'Levels 1 to 5 of every game, in every land',
  'The daily friend for the first 3 days',
  '3 Parent & Baby quests every day',
];

const PLUS = [
  'Every level of every game, and new worlds as they arrive',
  'The daily friend, every day',
  'The friends\' own adventures',
  'The full Parent & Baby Quest Library and progress over time',
  'Every child in the family',
];

function PlanList({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <p className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: accent }}>{title}</p>
      <ul className="space-y-2.5">
        {items.map(t => (
          <li key={t} className="flex items-start gap-3">
            <span aria-hidden className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: accent }} />
            <span className="text-sm text-indigo-100 font-semibold leading-snug">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
  const [premium, setPremiumState] = useState(false);
  const paywallOn = isPaywallEnabled();
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState<'ok' | 'bad' | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setPremiumState(isPremium());
    // A friend can be sent a link like /upgrade?code=KAILIASFRIENDS and
    // just tap it — no typing required.
    const urlCode = searchParams.get('code');
    if (urlCode && redeemCode(urlCode)) setPremiumState(true);
  }, [searchParams]);

  function unlockDemo() {
    setPremium(true);
    setPremiumState(true);
  }
  function resetDemo() {
    setPremium(false);
    setPremiumState(false);
  }
  function tryCode() {
    if (redeemCode(codeInput)) { setPremiumState(true); setCodeMsg('ok'); }
    else setCodeMsg('bad');
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)' }}>
      <div className="max-w-md mx-auto px-4 pt-6">
        <BackButton href="/play" label="Map" />

        <div className="text-center mt-4 mb-5">
          <div className="flex items-end justify-center gap-1 mb-3">
            <PandaSprite size={92} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
            <KailiaSprite size={76} expression="excited" className="float" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Kailia Plus</h1>
          <p className="text-indigo-200 text-sm">The whole adventure for your family</p>
        </div>

        {!paywallOn ? (
          <>
            <div className="rounded-3xl p-5 mb-4 text-center" style={{ background: 'rgba(253,224,71,0.12)', border: '2px solid rgba(253,224,71,0.45)' }}>
              <p className="text-yellow-200 font-extrabold text-lg mb-1">Everything is free right now</p>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Kailia&apos;s Story is in early access, so every land, game and friend is open for your
                family at no cost. Nothing to set up, no card needed.
              </p>
            </div>
            <p className="text-center text-xs font-bold text-indigo-300 mb-3">Later, the app will have a free plan and Kailia Plus:</p>
            <PlanList title="Always free" items={FREE} accent="#A5B4FC" />
            <PlanList title="Kailia Plus" items={PLUS} accent="#FDE047" />
          </>
        ) : premium ? (
          <div className="rounded-3xl p-5 mb-4 text-center" style={{ background: 'rgba(253,224,71,0.15)', border: '2px solid rgba(253,224,71,0.5)' }}>
            <p className="text-yellow-300 font-extrabold text-lg mb-1">You have Kailia Plus</p>
            <p className="text-indigo-200 text-sm mb-4">Every level, every friend and the full activity library are open.</p>
            {SHOW_DEMO_CONTROLS && (
              <button onClick={resetDemo}
                className="text-xs font-bold text-indigo-300 underline underline-offset-2">
                (Developer only) Reset to free
              </button>
            )}
          </div>
        ) : (
          <>
            <PlanList title="Always free" items={FREE} accent="#A5B4FC" />
            <PlanList title="Kailia Plus" items={PLUS} accent="#FDE047" />

            {SHOW_DEMO_CONTROLS && (
              <>
                <button onClick={unlockDemo}
                  className="w-full py-4 rounded-full font-extrabold text-lg text-indigo-950 shadow-xl transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                  Unlock Plus (developer test)
                </button>
                <p className="text-center text-[11px] text-indigo-400 mt-2 mb-5">
                  Only visible while developing. Real payment isn&apos;t connected yet.
                </p>
              </>
            )}

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-xs font-bold text-indigo-200 mb-2">Have a friends &amp; family code?</p>
              <div className="flex gap-2">
                <input value={codeInput} onChange={e => { setCodeInput(e.target.value); setCodeMsg(null); }}
                  placeholder="Enter code" aria-label="Friends and family code"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-bold text-indigo-950 bg-white/95" />
                <button onClick={tryCode}
                  className="px-4 py-2 rounded-xl font-extrabold text-sm text-white flex-shrink-0"
                  style={{ background: '#7C3AED' }}>
                  Redeem
                </button>
              </div>
              {codeMsg === 'bad' && <p className="text-xs text-red-300 font-semibold mt-2">That code didn&apos;t match. Try again.</p>}
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/play" className="text-sm font-bold text-indigo-300 hover:text-indigo-100">← Back to the map</Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
