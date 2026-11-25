'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { isPremium, setPremium, redeemCode, isPaywallOn } from '@/lib/premium';
import { PLANS, PRICE_SOON, type Plan } from '@/lib/pricing';
import BottomNav from '@/components/BottomNav';
import BackButton from '@/components/ui/BackButton';
import { ParentGatePage } from '@/components/ParentGate';

// ─── Plans (grown-ups only) ────────────────────────────────────────────────
// Compares Free, Family Premium and Pro side by side. Every word and price
// comes from lib/pricing.ts; a price left empty there shows "Price coming
// soon". The whole page sits behind the grown-up check, so a child can
// never reach a purchase on their own.
//
// No payment processor is connected yet (no App Store / Play billing). The
// "(Demo)" button is a local placeholder so the free/paid gating elsewhere
// can be tested end to end before real billing is wired up.

export default function UpgradePage() {
  return (
    <ParentGatePage note="Plans and prices are for grown-ups.">
      <Suspense fallback={null}>
        <UpgradeContent />
      </Suspense>
    </ParentGatePage>
  );
}

function PriceLines({ plan }: { plan: Plan }) {
  if (!plan.prices) return <p className="text-2xl font-extrabold text-white">Free</p>;
  const { monthly, yearly, trialDays } = plan.prices;
  if (!monthly && !yearly) {
    return (
      <>
        <p className="text-lg font-extrabold text-yellow-200">{PRICE_SOON}</p>
        <p className="text-sm text-indigo-200">Monthly and yearly options</p>
      </>
    );
  }
  return (
    <>
      <p className="text-lg font-extrabold text-white">{monthly ? `${monthly} a month` : `Monthly: ${PRICE_SOON.toLowerCase()}`}</p>
      <p className="text-base font-bold text-indigo-100">{yearly ? `or ${yearly} a year` : `Yearly: ${PRICE_SOON.toLowerCase()}`}</p>
      {trialDays ? <p className="text-sm text-yellow-200 font-bold mt-1">{trialDays}-day free trial</p> : null}
    </>
  );
}

function Tick() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="11" fill="#34D399" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#064E3B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Soon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#FDE047" strokeWidth="2.4" />
      <path d="M12 7v5l3 2" fill="none" stroke="#FDE047" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function UpgradeContent() {
  const [premium, setPremiumState] = useState(false);
  const [paywallOn, setPaywallOn] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeMsg, setCodeMsg] = useState<'ok' | 'bad' | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the plan lives in this device's storage, readable only after mount */
    setPaywallOn(isPaywallOn());
    setPremiumState(isPremium());
    // A friend can be sent a link like /upgrade?code=KAILIASFRIENDS and
    // just tap it (after the grown-up check), no typing required.
    const urlCode = searchParams.get('code');
    if (urlCode && redeemCode(urlCode)) setPremiumState(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  function unlockDemo() { setPremium(true); setPremiumState(isPremium()); }
  function resetDemo() { setPremium(false); setPremiumState(isPremium()); }
  function tryCode() {
    if (redeemCode(codeInput)) { setPremiumState(true); setCodeMsg('ok'); }
    else setCodeMsg('bad');
  }

  return (
    <main className="min-h-screen kp-nav-pad" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)' }}>
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 pt-6">
        <BackButton href="/family" label="Family" />

        <div className="text-center mt-4 mb-5">
          <div className="flex items-end justify-center gap-1 mb-3">
            <PandaSprite size={84} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
            <KailiaSprite size={70} expression="excited" className="float" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Plans for Kailia&apos;s Story</h1>
          <p className="text-indigo-100 text-base">Every game is free to try. A plan opens the whole adventure.</p>
          {!paywallOn && (
            <p className="text-sm text-indigo-200 mt-2">Right now everything is open for everyone while we get ready.</p>
          )}
        </div>

        {premium && paywallOn && (
          <div className="rounded-3xl p-4 mb-4 text-center" style={{ background: 'rgba(253,224,71,0.15)', border: '2px solid rgba(253,224,71,0.5)' }}>
            <p className="text-yellow-200 font-extrabold text-lg">Your family has Family Premium</p>
            <button onClick={resetDemo} className="mt-2 min-h-[48px] px-3 text-sm font-bold text-indigo-200 underline underline-offset-2">
              (Demo) Reset to free
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3 mb-5">
          {PLANS.map(plan => {
            const featured = plan.id === 'family';
            return (
              <section key={plan.id} aria-label={plan.name}
                className="rounded-3xl p-5 flex flex-col"
                style={{
                  background: featured ? 'rgba(253,224,71,0.10)' : 'rgba(255,255,255,0.07)',
                  border: featured ? '2px solid rgba(253,224,71,0.6)' : '1.5px solid rgba(255,255,255,0.18)',
                }}>
                <p className="text-sm font-extrabold uppercase tracking-wider text-indigo-200">{plan.forWho}</p>
                <h2 className="text-xl font-extrabold text-white mt-0.5 mb-2">{plan.name}</h2>
                <div className="mb-3"><PriceLines plan={plan} /></div>
                <ul className="space-y-2">
                  {plan.includes.map(t => (
                    <li key={t} className="flex items-start gap-2 text-base text-indigo-50 leading-snug"><Tick />{t}</li>
                  ))}
                  {plan.comingSoon?.map(t => (
                    <li key={t} className="flex items-start gap-2 text-base text-indigo-100 leading-snug">
                      <Soon /><span>{t} <span className="text-yellow-200 font-bold whitespace-nowrap">(coming soon)</span></span>
                    </li>
                  ))}
                </ul>
                {plan.id === 'family' && !(premium && paywallOn) && (
                  <div className="mt-auto pt-4">
                    <button onClick={unlockDemo}
                      className="w-full min-h-[52px] rounded-full font-extrabold text-lg text-indigo-950 shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                      Unlock Family Premium (Demo)
                    </button>
                    <p className="text-center text-sm text-indigo-200 mt-2">Real payment isn&apos;t connected yet. This button is for testing.</p>
                  </div>
                )}
                {plan.id === 'pro' && (
                  <p className="mt-auto pt-4 text-sm text-indigo-200">Pro needs sign-in accounts, which come after a privacy review.</p>
                )}
              </section>
            );
          })}
        </div>

        <div className="rounded-2xl p-4 max-w-md mx-auto" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <p className="text-base font-bold text-indigo-100 mb-2">Have a friends &amp; family code?</p>
          <div className="flex gap-2">
            <input value={codeInput} onChange={e => { setCodeInput(e.target.value); setCodeMsg(null); }}
              placeholder="Enter code" aria-label="Friends and family code" autoComplete="off"
              className="flex-1 min-w-0 min-h-[48px] px-3 rounded-xl text-base font-bold text-indigo-950 bg-white/95" />
            <button onClick={tryCode}
              className="min-h-[48px] px-4 rounded-xl font-extrabold text-base text-white flex-shrink-0"
              style={{ background: '#7C3AED' }}>
              Redeem
            </button>
          </div>
          {codeMsg === 'bad' && <p className="text-sm text-pink-200 font-semibold mt-2">That code didn&apos;t match. Try again.</p>}
          {codeMsg === 'ok' && <p className="text-sm text-emerald-200 font-semibold mt-2">Code accepted. Everything is open.</p>}
        </div>

        <p className="text-center text-sm text-indigo-200 mt-5 max-w-md mx-auto">
          No ads, ever. We never sell or share your family&apos;s information, and your child&apos;s play stays on this device.
        </p>

        <div className="mt-4 text-center">
          <Link href="/play" className="inline-block min-h-[48px] leading-[48px] px-3 text-base font-bold text-indigo-200 hover:text-white">Back to the map</Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
