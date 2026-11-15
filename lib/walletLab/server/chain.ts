// ── Wallet lab: talking to the test blockchain ──
// The issuer key owns the KailiaPetCard contract and pays every fee, so
// families never need crypto, a wallet app or test coins.

import {
  createPublicClient, createWalletClient, defineChain, http, parseEventLogs,
  type Address, type Chain, type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import card from '../KailiaPetCard.json';
import type { Settings } from './config';

export const cardAbi = card.abi as typeof card.abi;
export const cardBytecode = card.bytecode as Hex;

export interface OnChainPet {
  companion: number;
  stage: number;
  happyDays: number;
  hellos: number;
  hatchedAt: number; // unix seconds
  lastVisit: number; // unix seconds
}

function chainFor(s: Settings): Chain {
  return defineChain({
    id: s.chainId,
    name: s.chainName,
    nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [s.rpcUrl] } },
    testnet: true,
  });
}

let cached: ReturnType<typeof make> | null = null;

function make(s: Settings) {
  const chain = chainFor(s);
  const publicClient = createPublicClient({ chain, transport: http(s.rpcUrl) });
  const account = privateKeyToAccount(s.issuerKey!);
  const wallet = createWalletClient({ chain, transport: http(s.rpcUrl), account });
  const address = s.contract as Address;

  async function send(functionName: string, args: readonly unknown[]) {
    const hash = await wallet.writeContract({ address, abi: cardAbi, functionName, args } as never);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error(`${functionName} failed on chain`);
    return receipt;
  }

  return {
    chain,
    publicClient,
    issuerAddress: account.address,

    async mint(to: Address, companion: number): Promise<bigint> {
      const receipt = await send('mint', [to, companion]);
      const logs = parseEventLogs({ abi: cardAbi, logs: receipt.logs, eventName: 'Transfer' }) as unknown as { args: { tokenId: bigint } }[];
      if (!logs[0]) throw new Error('mint: no Transfer event');
      return logs[0].args.tokenId;
    },
    sync: (tokenId: bigint, companion: number, stage: number, happyDays: number) =>
      send('syncPet', [tokenId, companion, stage, happyDays]),
    hello: (tokenId: bigint) => send('sayHello', [tokenId]),
    release: (tokenId: bigint) => send('release', [tokenId]),

    async pet(tokenId: bigint): Promise<OnChainPet> {
      const p = (await publicClient.readContract({ address, abi: cardAbi, functionName: 'pet', args: [tokenId] })) as {
        companion: number; stage: number; happyDays: number; hellos: number; hatchedAt: bigint; lastVisit: bigint;
      };
      return {
        companion: Number(p.companion), stage: Number(p.stage), happyDays: Number(p.happyDays),
        hellos: Number(p.hellos), hatchedAt: Number(p.hatchedAt), lastVisit: Number(p.lastVisit),
      };
    },
  };
}

export function chainTools(s: Settings) {
  if (!s.issuerKey || !s.contract) throw new Error('Wallet lab: contract or issuer key missing');
  cached ??= make(s);
  return cached;
}
