// Puts the KailiaPetCard contract on a TEST network (one time).
//
//   WALLET_LAB_ISSUER_KEY=0x...  (a fresh key with a little free test ETH)
//   WALLET_LAB_ORIGIN=https://your-site.vercel.app
//   WALLET_LAB_RPC_URL=https://sepolia.base.org   (default)
//   WALLET_LAB_CHAIN_ID=84532                     (default: Base Sepolia)
//   node scripts/wallet-lab/deploy.mjs
//
// Prints the contract address to put in WALLET_LAB_CONTRACT.
// Pass --new-key to just print a brand-new issuer key and its address.
import fs from 'node:fs';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

if (process.argv.includes('--new-key')) {
  const key = generatePrivateKey();
  console.log('WALLET_LAB_ISSUER_KEY=' + key);
  console.log('address (send test ETH here):', privateKeyToAccount(key).address);
  process.exit(0);
}

const MAINNETS = new Set([1, 10, 56, 137, 8453, 42161, 43114, 4663]);
const chainId = Number(process.env.WALLET_LAB_CHAIN_ID ?? 84532);
if (MAINNETS.has(chainId)) throw new Error('Test networks only.');
const rpc = process.env.WALLET_LAB_RPC_URL ?? 'https://sepolia.base.org';
const origin = (process.env.WALLET_LAB_ORIGIN ?? '').replace(/\/$/, '');
if (!origin) throw new Error('Set WALLET_LAB_ORIGIN');
const key = process.env.WALLET_LAB_ISSUER_KEY;
if (!key) throw new Error('Set WALLET_LAB_ISSUER_KEY (or run with --new-key)');

const { abi, bytecode } = JSON.parse(fs.readFileSync(new URL('../../lib/walletLab/KailiaPetCard.json', import.meta.url)));
const chain = defineChain({ id: chainId, name: 'test', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } });
const account = privateKeyToAccount(key);
const pub = createPublicClient({ chain, transport: http(rpc) });
const wallet = createWalletClient({ chain, transport: http(rpc), account });

const hash = await wallet.deployContract({ abi, bytecode, args: [`${origin}/wallet-pass/`, account.address] });
const { contractAddress } = await pub.waitForTransactionReceipt({ hash });
// The issuer key is also the operator that may call the bounded pet actions.
const op = await wallet.writeContract({ address: contractAddress, abi, functionName: 'setActionOperator', args: [account.address, true] });
await pub.waitForTransactionReceipt({ hash: op });
console.log('WALLET_LAB_CONTRACT=' + contractAddress);
