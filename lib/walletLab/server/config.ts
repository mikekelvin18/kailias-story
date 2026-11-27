// ── Wallet lab: server settings ──
// Everything comes from environment variables so nothing secret is ever in
// the code. The lab is off unless WALLET_LAB_ENABLED=1.

import type { WalletLabPublicConfig } from '../shared';

const CHAINS: Record<number, { name: string; rpc: string }> = {
  84532: { name: 'Base Sepolia (test network)', rpc: 'https://sepolia.base.org' },
  11155111: { name: 'Sepolia (test network)', rpc: 'https://rpc.sepolia.org' },
  31337: { name: 'Local test chain', rpc: 'http://127.0.0.1:8545' },
};
// Real-money networks are refused outright: this is a test.
const MAINNETS = new Set([1, 10, 56, 137, 8453, 42161, 43114, 4663]);

export function labEnabled(): boolean {
  return process.env.WALLET_LAB_ENABLED === '1';
}

/** PEMs may be pasted raw or base64-encoded (some hosts mangle newlines). */
function pem(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  if (v.includes('-----BEGIN')) return v.replace(/\\n/g, '\n');
  return Buffer.from(v, 'base64').toString('utf8');
}

export function settings() {
  const chainId = Number(process.env.WALLET_LAB_CHAIN_ID ?? 84532);
  if (MAINNETS.has(chainId)) throw new Error('Wallet lab runs on test networks only.');
  const chain = CHAINS[chainId] ?? { name: `Chain ${chainId}`, rpc: '' };
  const origin = (process.env.WALLET_LAB_ORIGIN ?? '').replace(/\/$/, '');
  return {
    chainId,
    chainName: chain.name,
    rpcUrl: process.env.WALLET_LAB_RPC_URL || chain.rpc,
    contract: (process.env.WALLET_LAB_CONTRACT || null) as `0x${string}` | null,
    issuerKey: (process.env.WALLET_LAB_ISSUER_KEY || null) as `0x${string}` | null,
    linkSecret: process.env.WALLET_LAB_LINK_SECRET || null,
    origin,
    kv: {
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null,
    },
    apple: process.env.APPLE_PASS_TYPE_ID
      ? {
          passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
          teamIdentifier: process.env.APPLE_TEAM_ID ?? '',
          signerCert: pem('APPLE_PASS_CERT_PEM'),
          signerKey: pem('APPLE_PASS_KEY_PEM'),
          signerKeyPassphrase: process.env.APPLE_PASS_KEY_PASSPHRASE || undefined,
          wwdr: pem('APPLE_WWDR_PEM'),
        }
      : null,
    google: process.env.GOOGLE_WALLET_ISSUER_ID
      ? {
          issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
          serviceAccount: process.env.GOOGLE_WALLET_SA_JSON ? JSON.parse(process.env.GOOGLE_WALLET_SA_JSON) : null,
        }
      : null,
  };
}

export type Settings = ReturnType<typeof settings>;

export function missingSettings(s: Settings): string[] {
  const m: string[] = [];
  if (!s.origin.startsWith('https://') && !s.origin.startsWith('http://localhost')) m.push('WALLET_LAB_ORIGIN (the site address, https)');
  if (!s.rpcUrl) m.push('WALLET_LAB_RPC_URL');
  if (!s.contract) m.push('WALLET_LAB_CONTRACT (run the deploy script)');
  if (!s.issuerKey) m.push('WALLET_LAB_ISSUER_KEY');
  if (!s.linkSecret || s.linkSecret.length < 32) m.push('WALLET_LAB_LINK_SECRET (32+ characters)');
  const devMemory = process.env.WALLET_LAB_MEMORY_STORE === '1' && process.env.NODE_ENV !== 'production';
  if (!devMemory && (!s.kv.url || !s.kv.token)) m.push('Upstash Redis (UPSTASH_REDIS_REST_URL and _TOKEN)');
  if (s.apple && (!s.apple.teamIdentifier || !s.apple.signerCert || !s.apple.signerKey || !s.apple.wwdr)) {
    m.push('Apple: APPLE_TEAM_ID, APPLE_PASS_CERT_PEM, APPLE_PASS_KEY_PEM, APPLE_WWDR_PEM');
  }
  if (s.google && !s.google.serviceAccount) m.push('Google: GOOGLE_WALLET_SA_JSON');
  if (!s.apple && !s.google) m.push('Apple Wallet or Google Wallet account (at least one)');
  return m;
}

export function publicConfig(): WalletLabPublicConfig {
  const s = settings();
  const missing = missingSettings(s);
  return {
    chainId: s.chainId,
    chainName: s.chainName,
    rpcUrl: s.rpcUrl,
    contract: s.contract,
    apple: !!s.apple,
    google: !!s.google,
    ready: missing.length === 0,
    missing,
  };
}
