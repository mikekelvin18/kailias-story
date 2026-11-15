// ── Wallet lab: the card key on this device ──
// Each child's pet card is held by a random key made right here in the
// browser (no email, no crypto wallet app, no seed phrase to write down).
// The key only proves "this device made this card" to the card server.
// Stored per child as kailia_walletpet_v1 (in CHILD_DATA_KEYS), so deleting
// the child or the account removes it, and releaseWalletCard() deletes the
// card itself on the test blockchain.

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

export const WALLET_PET_KEY = 'kailia_walletpet_v1';

export interface WalletPetRecord {
  v: 1;
  key: Hex;
  chainId: number;
  contract: `0x${string}`;
  tokenId: string;
  rpcUrl: string;
  madeAt: string;
  syncedAt: string | null;
}

function storageKey(childId: string | null): string {
  return childId ? `${WALLET_PET_KEY}::${childId}` : WALLET_PET_KEY;
}

export function loadWalletPet(childId: string | null): WalletPetRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const r = JSON.parse(localStorage.getItem(storageKey(childId)) ?? 'null');
    return r?.v === 1 && typeof r.key === 'string' ? r : null;
  } catch { return null; }
}

export function saveWalletPet(childId: string | null, r: WalletPetRecord) {
  try { localStorage.setItem(storageKey(childId), JSON.stringify(r)); } catch { /* ignore */ }
}

export function forgetWalletPet(childId: string | null) {
  try { localStorage.removeItem(storageKey(childId)); } catch { /* ignore */ }
}

export function newCardKey(): { key: Hex; address: `0x${string}` } {
  const key = generatePrivateKey();
  return { key, address: privateKeyToAccount(key).address };
}

async function passClient(r: WalletPetRecord) {
  const [{ createPublicClient, http, defineChain }, { createWalletPassClient }] = await Promise.all([
    import('viem'),
    import('@erc8426/client'),
  ]);
  const chain = defineChain({
    id: r.chainId, name: 'test', nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [r.rpcUrl] } }, testnet: true,
  });
  return createWalletPassClient({ publicClient: createPublicClient({ chain, transport: http(r.rpcUrl) }) });
}

/** Ask the card server to do something, signed by this device's card key. */
export async function cardAction(r: WalletPetRecord, action: 'sync' | 'release', params?: Record<string, unknown>) {
  const client = await passClient(r);
  return client.signedAction({
    token: { contract: r.contract, tokenId: BigInt(r.tokenId) },
    action,
    signer: privateKeyToAccount(r.key),
    params,
  });
}

/**
 * Deletes a child's card on the test blockchain (best effort) and forgets
 * its key. Called by deleteChildAndData / deleteEverything in lib/family.ts.
 * If the network call fails the key is still forgotten; the card holds only
 * pet info and the server copy is purged per the retention policy.
 */
export async function releaseWalletCard(childId: string | null) {
  const r = loadWalletPet(childId);
  if (!r) return;
  try { await cardAction(r, 'release'); } catch { /* offline or lab off */ }
  forgetWalletPet(childId);
}
