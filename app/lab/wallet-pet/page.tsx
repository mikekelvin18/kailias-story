// Wallet lab (experiment): the care pet as an Apple / Google Wallet card
// through ERC-8426. Grown-ups only, linked from nowhere, and a 404 unless
// WALLET_LAB_ENABLED=1 is set on the server. See docs/wallet-lab.md.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { labEnabled, publicConfig } from '@/lib/walletLab/server/config';
import WalletLab from '@/components/walletLab/WalletLab';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pet card (test)', robots: { index: false, follow: false } };

export default function WalletPetLabPage() {
  if (!labEnabled()) notFound();
  let config;
  try {
    config = publicConfig();
  } catch (e) {
    return <main className="p-6 max-w-lg mx-auto"><p className="font-bold">{e instanceof Error ? e.message : 'Setup error'}</p></main>;
  }
  return <WalletLab config={config} />;
}
