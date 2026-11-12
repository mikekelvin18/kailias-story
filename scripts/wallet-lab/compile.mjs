// Compiles contracts/KailiaPetCard.sol into lib/walletLab/KailiaPetCard.json
// ({ abi, bytecode }). Only needed when the contract changes.
//
//   npm i --no-save solc@0.8.26 @erc8426/contracts@0.2.0 @openzeppelin/contracts@5.1.0
//   node scripts/wallet-lab/compile.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const solc = require('solc');
const root = process.cwd();
const src = fs.readFileSync(path.join(root, 'contracts/KailiaPetCard.sol'), 'utf8');

function findImports(p) {
  try {
    return { contents: fs.readFileSync(require.resolve(p), 'utf8') };
  } catch (e) {
    return { error: String(e) };
  }
}

const input = {
  language: 'Solidity',
  sources: { 'KailiaPetCard.sol': { content: src } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'shanghai',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (out.errors ?? []).filter((e) => e.severity === 'error');
for (const e of out.errors ?? []) console.error(e.formattedMessage);
if (errors.length) process.exit(1);
const c = out.contracts['KailiaPetCard.sol'].KailiaPetCard;
const dest = path.join(root, 'lib/walletLab/KailiaPetCard.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify({ contractName: 'KailiaPetCard', abi: c.abi, bytecode: '0x' + c.evm.bytecode.object }, null, 2) + '\n');
console.log('wrote', path.relative(root, dest), `(${c.evm.bytecode.object.length / 2} bytes)`);
