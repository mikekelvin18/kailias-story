'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { isPremium, setPremium, redeemCode } from '@/lib/premium';
import BottomNav from '@/components/BottomNav';

// ─── Upgrade / pricing ─────────────────────────────────────────────────────
// No payment processor is connected yet (no Stripe/App Store/Play billing).
// The "Unlock Premium (Demo)" button is a local placeholder so the
// free/paid gating elsewhere in the app (world map quests, quest library)
// can be built and tested end-to-end before real billing is wired up.

const PERKS = [
  { emoji: '🗺️', text: 'Every quest in all six lands — not just the first per skill' },
  { emoji: '📚', text: 'The full Parent & Baby Quest Library, growing every month' },
  { emoji: '📈', text: 'Full parent dashboard with progress over time' },
  { emoji: '👨‍👩‍👧‍👦', text: 'Unlimited child profiles for the whole family' },
];

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeContent />
    </Suspense>
  );
}

function UpgradeContent() {
  const [premium, setPremiumState] = useState(false);
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
        <Link href="/play" className="text-sm font-bold text-indigo-300">← Map</Link>

        <div className="text-center mt-4 mb-5">
          <div className="flex items-end justify-center gap-1 mb-3">
            <PandaSprite size={92} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
            <KailiaSprite size={76} expression="excited" className="float" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Kailia&apos;s Story Premium</h1>
          <p className="text-indigo-200 text-sm">Unlock the whole adventure for your family</p>
        </div>

        {premium ? (
          <div className="rounded-3xl p-5 mb-4 text-center" style={{ background: 'rgba(253,224,71,0.15)', border: '2px solid rgba(253,224,71,0.5)' }}>
            <p className="text-yellow-300 font-extrabold text-lg mb-1">✨ You&apos;re Premium!</p>
            <p className="text-indigo-200 text-sm mb-4">Every land, every quest, and the full activity library are unlocked.</p>
            <button onClick={resetDemo}
              className="text-xs font-bold text-indigo-300 underline underline-offset-2">
              (Demo) Reset to free
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-5 mb-4 space-y-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {PERKS.map(p => (
                <div key={p.text} className="flex items-start gap-3">
                  <span className="text-xl">{p.emoji}</span>
                  <p className="text-sm text-indigo-100 font-semibold leading-snug pt-0.5">{p.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-indigo-300">
                Free forever: the first quest in every land, 3 daily Parent &amp; Baby quests, and a
                sample of the activity library — try every skill before you upgrade.
              </p>
            </div>

            <button onClick={unlockDemo}
              className="w-full py-4 rounded-full font-extrabold text-lg text-indigo-950 shadow-xl transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Unlock Premium (Demo) ✨
            </button>
            <p className="text-center text-[11px] text-indigo-400 mt-2 mb-5">
              Real payment isn&apos;t connected yet — this button is a placeholder for testing.
            </p>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-xs font-bold text-indigo-200 mb-2">Have a friends & family code?</p>
              <div className="flex gap-2">
                <input value={codeInput} onChange={e => { setCodeInput(e.target.value); setCodeMsg(null); }}
                  placeholder="Enter code"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm font-bold text-indigo-950 bg-white/95" />
                <button onClick={tryCode}
                  className="px-4 py-2 rounded-xl font-extrabold text-sm text-white flex-shrink-0"
                  style={{ background: '#7C3AED' }}>
                  Redeem
                </button>
              </div>
              {codeMsg === 'bad' && <p className="text-xs text-red-300 font-semibold mt-2">That code didn&apos;t match — try again.</p>}
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
