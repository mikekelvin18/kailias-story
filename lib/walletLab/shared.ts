// ── Wallet lab: shared bits (browser + server) ──
// An EXPERIMENT: the daily care pet shown as an Apple Wallet / Google Wallet
// card through ERC-8426 (an NFT standard for wallet passes), on a TEST
// blockchain only. Grown-up only, never linked from a child screen, and off
// unless WALLET_LAB_ENABLED=1. See docs/wallet-lab.md.

// Same order as COMPANIONS in lib/rewards.ts. The card stores the index.
export const CARD_PETS = [
  { name: 'Shelly', slug: 'shelly' },
  { name: 'Flick', slug: 'flick' },
  { name: 'Sage', slug: 'sage' },
  { name: 'Nova', slug: 'nova' },
  { name: 'Ember', slug: 'ember' },
  { name: 'Kiko', slug: 'kiko' },
] as const;

export const STAGE_NAMES = ['Magic egg', 'Baby', 'Little one', 'Grown up'] as const;
export const STAGE_SLUGS = ['egg', 'baby', 'little', 'grown'] as const;

export function companionIndex(name: string | null | undefined): number {
  const i = CARD_PETS.findIndex((p) => p.name === name);
  return i < 0 ? 5 : i; // Kiko by default, like the care pet
}

export function stageIndex(stage: string): number {
  const i = (STAGE_SLUGS as readonly string[]).indexOf(stage);
  return i < 0 ? 0 : i;
}

// What the grown-up page needs to know (never secrets).
export interface WalletLabPublicConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  contract: `0x${string}` | null;
  apple: boolean;
  google: boolean;
  ready: boolean;
  missing: string[];
}
