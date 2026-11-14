// End-to-end check of the wallet lab, acting like a family's phone:
// make a card, refuse a stranger, sync the pet, download the Apple card,
// tap "Say hi" (3 a day, then politely limited), delete the card.
//
// Needs a running app with the lab on (Apple settings may be stand-in
// self-signed certificates) and the WALLET_LAB_* variables in the shell:
//   node scripts/wallet-lab/e2e.mjs
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/package.json');
const { createPublicClient, http, defineChain } = require('viem');
const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');
const { createWalletPassClient } = await import(process.cwd() + '/node_modules/@erc8426/client/dist/index.js');
const card = require(process.cwd() + '/lib/walletLab/KailiaPetCard.json');

const O = process.env.WALLET_LAB_ORIGIN ?? 'http://localhost:3077';
const contract = process.env.WALLET_LAB_CONTRACT;
const RPC = process.env.WALLET_LAB_RPC_URL ?? 'http://127.0.0.1:8545';
const chain = defineChain({ id: Number(process.env.WALLET_LAB_CHAIN_ID ?? 31337), name: 'local', nativeCurrency: { name: 'E', symbol: 'E', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });
const pub = createPublicClient({ chain, transport: http() });
const passes = createWalletPassClient({ publicClient: pub });
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } console.log('ok  ', m); };

const key = generatePrivateKey(); const me = privateKeyToAccount(key);
const mint = await fetch(`${O}/api/wallet-lab/mint`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: me.address, companion: 5 }) });
const m = await mint.json(); ok(mint.ok, 'mint ' + JSON.stringify(m));
const token = { contract, tokenId: BigInt(m.tokenId) };
ok(await passes.supportsWalletPass(contract), 'contract advertises ERC-8426');

// a stranger cannot get the card
const stranger = privateKeyToAccount(generatePrivateKey());
try { await passes.addToWallet(token, { signer: stranger, platform: 'apple' }); ok(false, 'stranger blocked'); }
catch (e) { ok(e.code === 'not_owner', 'stranger refused: ' + e.code); }

// sync the pet: Kiko, little one, 6 happy days
const r = await passes.signedAction({ token, action: 'sync', signer: me, params: { companion: 5, stage: 2, happyDays: 6 } });
ok(r.status === 200, 'sync ' + r.status + ' ' + JSON.stringify(r.body));
const p = await pub.readContract({ address: contract, abi: card.abi, functionName: 'pet', args: [token.tokenId] });
ok(p.stage === 2 && p.happyDays === 6, 'on-chain pet ' + JSON.stringify(p, (k, v) => typeof v === 'bigint' ? v.toString() : v));

// add to Apple Wallet: download the .pkpass
const { url } = await passes.addToWallet(token, { signer: me, platform: 'apple' });
ok(url.includes('/wallet-pass/passes/'), 'apple url ' + url);
const pk = await fetch(url); const buf = Buffer.from(await pk.arrayBuffer());
ok(pk.ok && pk.headers.get('content-type').includes('pkpass') && buf[0] === 0x50 && buf[1] === 0x4b, `pkpass ${buf.length} bytes`);
const fs = await import('node:fs'); fs.writeFileSync(new URL('file:///tmp/wallet-lab-card.pkpass'), buf);

const { execSync } = await import('node:child_process');
const pj = JSON.parse(execSync('unzip -p ' + new URL('file:///tmp/wallet-lab-card.pkpass').pathname + ' pass.json').toString());
const hello = pj.storeCard.backFields.find(f => f.key === 'hello').attributedValue.match(/href="([^"]+)"/)[1];
const page = await fetch(hello, { headers: { accept: 'text/html' } }); ok(page.ok && (await page.text()).includes('<form'), 'hello link shows a confirm page (GET does nothing)');
const codes = [];
for (let i = 0; i < 4; i++) { const r = await fetch(hello, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ attempt: String(i) }) }); codes.push(r.status); }
const p2 = await pub.readContract({ address: contract, abi: card.abi, functionName: 'pet', args: [token.tokenId] });
ok(p2.hellos === 3 && codes.slice(0, 3).every(c => c === 200) && codes[3] >= 400, 'hello x3 then limited: ' + codes.join(',') + ' hellos=' + p2.hellos);
// happy days can't go backwards
const back = await passes.signedAction({ token, action: 'sync', signer: me, params: { companion: 5, stage: 2, happyDays: 2 } }).catch(e => ({ status: e.status ?? 'err', body: e.message }));
ok(back.status >= 400, 'backwards happy days refused ' + back.status);

// release
const rel = await passes.signedAction({ token, action: 'release', signer: me });
ok(rel.status === 200, 'release ' + rel.status);
const gone = await pub.readContract({ address: contract, abi: card.abi, functionName: 'pet', args: [token.tokenId] }).then(() => false, () => true);
ok(gone, 'card burned on chain');
console.log('ALL PASSED');
