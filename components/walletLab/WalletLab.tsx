'use client';

// ── Wallet lab page (grown-ups only) ──
// One clear step at a time: grown-up check → make the card → add it to the
// phone's wallet → keep it in step with the care pet. Nothing here is
// shown to children and nothing here is linked from a child screen.

import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AddToWalletButton, WalletPassProvider } from '@erc8426/react';
import BackButton from '@/components/ui/BackButton';
import { loadFamily, activeChild } from '@/lib/family';
import { loadPet } from '@/lib/kailiaPet';
import { stageFor } from '@/lib/carepet/engine';
import { getFocusCompanion } from '@/lib/rewards';
import { CARD_PETS, STAGE_NAMES, companionIndex, stageIndex, type WalletLabPublicConfig } from '@/lib/walletLab/shared';
import {
  cardAction, forgetWalletPet, loadWalletPet, newCardKey, saveWalletPet, type WalletPetRecord,
} from '@/lib/walletLab/device';

type Busy = null | 'make' | 'sync' | 'delete';

function GrownUpCheck({ onPass }: { onPass: () => void }) {
  // picked after the page loads, so the server and browser render the same thing
  const [q, setQ] = useState({ a: 7, b: 6 });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random only after mount, so server and browser match
    setQ({ a: 6 + Math.floor(Math.random() * 4), b: 3 + Math.floor(Math.random() * 6) });
  }, []);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      if (Number(answer) === q.a * q.b) onPass(); else { setWrong(true); setAnswer(''); }
    }}>
      <p className="font-extrabold text-lg">Grown-ups only</p>
      <label className="block font-semibold">What is {q.a} × {q.b}?
        <input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
          className="mt-2 block w-32 min-h-[44px] rounded-xl border-2 border-violet-300 px-3 text-lg font-bold text-gray-900 bg-white" />
      </label>
      {wrong && <p className="text-sm font-semibold text-violet-700">Not quite. Try again.</p>}
      <button type="submit" className="min-h-[44px] px-5 rounded-full bg-violet-700 text-white font-extrabold">Continue</button>
    </form>
  );
}

export default function WalletLab({ config }: { config: WalletLabPublicConfig }) {
  const [grownUp, setGrownUp] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [card, setCard] = useState<WalletPetRecord | null>(null);
  const [pet, setPet] = useState({ companion: 5, stage: 0, happyDays: 0, hasPet: false });
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the pet and card live in this device's storage, readable only after mount */
    const id = activeChild(loadFamily())?.id ?? null;
    setChildId(id);
    setCard(loadWalletPet(id));
    const s = loadPet();
    if (s) {
      const happy = s.happyDays;
      setPet({ companion: companionIndex(getFocusCompanion()), stage: stageIndex(stageFor(happy)), happyDays: happy, hasPet: true });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const publicClient = useMemo(() => {
    if (!config.rpcUrl) return null;
    const chain = defineChain({
      id: config.chainId, name: config.chainName, nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [config.rpcUrl] } }, testnet: true,
    });
    return createPublicClient({ chain, transport: http(config.rpcUrl) });
  }, [config.chainId, config.chainName, config.rpcUrl]);

  const friend = CARD_PETS[pet.companion];
  const picture = pet.stage === 0 ? '/wallet-lab/strip-egg@2x.png' : `/wallet-lab/strip-${friend.slug}-${['egg', 'baby', 'little', 'grown'][pet.stage]}@2x.png`;

  async function makeCard() {
    setBusy('make'); setNote(null);
    try {
      const { key, address } = newCardKey();
      const res = await fetch('/api/wallet-lab/mint', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, companion: pet.companion }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? 'Too many test cards today. Try tomorrow.' : `The card server said ${res.status}.`);
      const j = await res.json() as { tokenId: string; contract: `0x${string}`; chainId: number };
      const rec: WalletPetRecord = {
        v: 1, key, chainId: j.chainId, contract: j.contract, tokenId: j.tokenId,
        rpcUrl: config.rpcUrl, madeAt: new Date().toISOString(), syncedAt: null,
      };
      saveWalletPet(childId, rec);
      setCard(rec);
      if (pet.stage > 0 || pet.happyDays > 0) await sync(rec);
      setNote('Your card is ready. Tap Add to Wallet.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally { setBusy(null); }
  }

  async function sync(rec = card) {
    if (!rec) return;
    setBusy('sync'); setNote(null);
    try {
      const r = await cardAction(rec, 'sync', { companion: pet.companion, stage: pet.stage, happyDays: pet.happyDays });
      if (r.status >= 400) throw new Error(`The card server said ${r.status}.`);
      const next = { ...rec, syncedAt: new Date().toISOString() };
      saveWalletPet(childId, next); setCard(next);
      setNote('Card updated. It can take a minute to show on your phone.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not update the card. Try again.');
    } finally { setBusy(null); }
  }

  async function deleteCard() {
    if (!card || !window.confirm('Delete this pet card? It will stop updating and you can remove it from your wallet.')) return;
    setBusy('delete'); setNote(null);
    try { await cardAction(card, 'release'); } catch { /* still forget it here */ }
    forgetWalletPet(childId); setCard(null); setBusy(null);
    setNote('Card deleted.');
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: '#F4F1FB', color: '#1F1B3A' }}>
      <div className="max-w-lg mx-auto space-y-5">
        <BackButton href="/family" label="Parent Zone" />
        <header>
          <p className="text-xs font-extrabold tracking-widest text-violet-700">EXPERIMENT</p>
          <h1 className="text-2xl font-extrabold">Pet card for your phone&apos;s wallet</h1>
          <p className="mt-1 font-semibold text-gray-700">Your child&apos;s care pet as an Apple Wallet or Google Wallet card. It grows when the pet grows and never gets sick or goes away.</p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {!grownUp ? <GrownUpCheck onPass={() => setGrownUp(true)} /> : !config.ready ? (
            <div className="space-y-2">
              <p className="font-extrabold">Not set up yet</p>
              <p className="text-sm font-semibold text-gray-700">The card server still needs:</p>
              <ul className="list-disc pl-5 text-sm text-gray-700">{config.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          ) : (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={picture} alt={pet.stage === 0 ? 'A magic egg' : `${friend.name}, ${STAGE_NAMES[pet.stage].toLowerCase()}`}
                className="w-full rounded-xl" style={{ aspectRatio: '375 / 123' }} />
              <p className="font-bold">
                {pet.hasPet ? <>{pet.stage === 0 ? 'Magic egg' : friend.name} · {STAGE_NAMES[pet.stage]} · {pet.happyDays} happy {pet.happyDays === 1 ? 'day' : 'days'}</> : 'No care pet yet. The card starts as a magic egg.'}
              </p>

              {!card ? (
                <button onClick={makeCard} disabled={busy !== null}
                  className="w-full min-h-[48px] rounded-full bg-violet-700 text-white font-extrabold disabled:opacity-60">
                  {busy === 'make' ? 'Making your card…' : 'Make the pet card'}
                </button>
              ) : (
                <>
                  {publicClient && (
                    <WalletPassProvider options={{ publicClient }}>
                      <AddToWalletButton contract={card.contract} tokenId={BigInt(card.tokenId)}
                        signer={privateKeyToAccount(card.key)}
                        className="w-full min-h-[48px] rounded-full bg-black text-white font-extrabold"
                        containerClassName="flex flex-col gap-1 text-xs text-gray-600" />
                    </WalletPassProvider>
                  )}
                  <button onClick={() => sync()} disabled={busy !== null}
                    className="w-full min-h-[44px] rounded-full border-2 border-violet-700 text-violet-800 font-extrabold disabled:opacity-60">
                    {busy === 'sync' ? 'Updating…' : 'Update the card with today’s pet'}
                  </button>
                  <p className="text-xs text-gray-600">Last updated: {card.syncedAt ? new Date(card.syncedAt).toLocaleString() : 'not yet'}</p>
                  <button onClick={deleteCard} disabled={busy !== null} className="text-sm font-bold text-gray-600 underline min-h-[44px]">
                    Delete this card
                  </button>
                </>
              )}
              {note && <p role="status" className="text-sm font-semibold text-violet-800">{note}</p>}
            </div>
          )}
        </section>

        <details className="rounded-2xl bg-white p-5 shadow-sm">
          <summary className="font-extrabold cursor-pointer">What is stored, and where?</summary>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>On a test blockchain ({config.chainName}): the pet&apos;s kind, growth stage, happy days and hellos. Nothing about your child.</li>
            <li>On the card server: the card number, and your phone&apos;s wallet update address so the card can refresh.</li>
            <li>On this device: a private card key that proves the card is yours. No email, no crypto wallet app.</li>
            <li>The card has no money value and can&apos;t be sold or traded. Deleting your child&apos;s data in the Parent Zone deletes the card too.</li>
          </ul>
        </details>
      </div>
    </main>
  );
}
