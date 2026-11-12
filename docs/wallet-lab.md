# Wallet lab: the care pet as a wallet card (experiment)

**Status: experiment.** Off unless `WALLET_LAB_ENABLED=1`. Test blockchain only. Not linked from any screen. Needs a privacy lawyer's review before any real family uses it.

## What it does, in plain words

A grown-up opens `/lab/wallet-pet`, answers a grown-up question, and taps **Make the pet card**. The app makes a card for the child's care pet and the grown-up taps **Add to Wallet**. The card then sits in Apple Wallet or Google Wallet:

- It shows the pet (egg, baby, little one, grown up), happy days and hellos.
- **Update the card** sends today's pet growth to the card. The phone shows a little notice when the pet grows ("Kiko grew! Now: Grown up").
- On the back of the card, **Say hi to Kiko** opens a page with a big "Say hi!" button. The pet hears up to 3 hellos a day.
- The pet never gets sick, never dies and never counts down. A missed day only says "Missed you! Come say hi".
- **Delete this card** (or deleting the child's data in the Parent Zone) deletes the card everywhere.

Preview pictures: `/mnt/project-files/wallet-pet-card/` in the project files.

## How ERC-8426 fits

ERC-8426 is a draft Ethereum standard that ties an NFT to an Apple/Google Wallet pass. Here:

- Each card is a token in our `KailiaPetCard` contract (`contracts/KailiaPetCard.sol`). It holds only: which pet (0-5), stage (0-3), happy days, hellos and the last update time.
- The token belongs to a random key made in the family's browser (`lib/walletLab/device.ts`). No email, no crypto wallet app, no seed phrase. That key signs a one-time challenge to prove the card is theirs.
- Our server (`lib/walletLab/server/issuer.ts`, the `@erc8426/*` toolkit) builds and updates the wallet card, and pays every blockchain fee.
- Kid-safety choices, enforced in the contract: cards can't be sold, traded or given away; no money, tokens or prize pot; "say hi" and "update" are capped per day.

## Setup checklist (one time)

You need four things. Everything secret goes into Vercel's **Environment Variables** (Project → Settings → Environment Variables), never into the code.

### 1. Turn the lab on
| Variable | Value |
|---|---|
| `WALLET_LAB_ENABLED` | `1` |
| `WALLET_LAB_ORIGIN` | the site address, e.g. `https://kailias-story.vercel.app` |
| `WALLET_LAB_LINK_SECRET` | 32+ random characters (any password generator) |

### 2. A small free database (Upstash Redis)
In Vercel: **Storage → Create → Upstash Redis (free)** and connect it to the project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `_TOKEN`) by itself.

### 3. The test blockchain (Base Sepolia, free)
1. Make a server key: `node scripts/wallet-lab/deploy.mjs --new-key`. It prints `WALLET_LAB_ISSUER_KEY=0x…` and an address.
2. Get free test coins for that address from a Base Sepolia faucet (Coinbase Developer Platform, Alchemy or QuickNode faucets). A tiny amount lasts for thousands of cards.
3. Put the contract on the test network: `WALLET_LAB_ISSUER_KEY=… WALLET_LAB_ORIGIN=… node scripts/wallet-lab/deploy.mjs`. It prints `WALLET_LAB_CONTRACT=0x…`.
4. Add `WALLET_LAB_ISSUER_KEY` and `WALLET_LAB_CONTRACT` to Vercel. (`WALLET_LAB_CHAIN_ID` defaults to `84532`, `WALLET_LAB_RPC_URL` to `https://sepolia.base.org`.)

### 4a. Google Wallet (free, start here)
1. Sign in at the [Google Pay & Wallet Console](https://pay.google.com/business/console), open **Google Wallet API** and copy the long **number** issuer ID → `GOOGLE_WALLET_ISSUER_ID`.
2. In Google Cloud: make a project, turn on **Google Wallet API**, create a **service account** with no roles, and download a JSON key → paste the whole JSON into `GOOGLE_WALLET_SA_JSON`.
3. Back in the Wallet console → **Users**, invite the service account's email with **Developer** access.
The card type used ("generic") needs no review by Google.

### 4b. Apple Wallet (needs the $99/year Apple Developer account)
1. Enroll at [developer.apple.com](https://developer.apple.com/programs/) (needed for the phone app anyway). Note the **Team ID** → `APPLE_TEAM_ID`.
2. Certificates, Identifiers & Profiles → **Pass Type IDs** → make one like `pass.com.kailiasstory.petcard` → `APPLE_PASS_TYPE_ID`.
3. Make its certificate, export it from Keychain as a `.p12`, and turn it into two files with the commands in `node_modules/@erc8426/apple/README.md` → paste them (or their base64) into `APPLE_PASS_CERT_PEM` and `APPLE_PASS_KEY_PEM` (and `APPLE_PASS_KEY_PASSPHRASE` if you set one).
4. Download Apple's **WWDR G4** certificate, convert it as in that README → `APPLE_WWDR_PEM`.
The Pass Type certificate expires once a year; renew it or cards stop updating.

Then open `https://<site>/lab/wallet-pet`. If anything is missing, the page lists it.

## Privacy notes (for the lawyer review)

This is the first feature that sends anything to a server, so it breaks the app's "child data never leaves the device" rule on purpose, as a test:

- **On the test blockchain (public, permanent):** pet kind, stage, happy days, hellos, timestamps, and the random card key's address. A burn on delete removes the pet record from current state, but blockchains keep history.
- **In Redis:** card serials, link seeds, the rendered card (pet only) and Apple device push tokens. Push tokens are device identifiers, which COPPA can treat as personal information. They are removed when the phone removes the card; a cleanup job that also purges them within 30 days of a card being deleted is still to do before any real use.
- **Apple / Google:** they host the card on the parent's phone like any wallet pass.
- No name, age, photo, email, scores or assessment data go anywhere.

## Code map

| Path | What |
|---|---|
| `contracts/KailiaPetCard.sol` | The kind pet card contract (ERC-8426 + bounded actions) |
| `lib/walletLab/KailiaPetCard.json` | Compiled contract (`scripts/wallet-lab/compile.mjs`) |
| `lib/walletLab/server/*` | Settings, stores, blockchain calls, card design, ERC-8426 issuer |
| `lib/walletLab/device.ts` | The card key on the family's device, sync and delete |
| `app/wallet-pass/[...path]` | ERC-8426 routes (manifest, challenge, actions, links, downloads) |
| `app/wallet-apple/[...path]` | Apple Wallet update service |
| `app/api/wallet-lab/mint` | Makes a card (capped per day) |
| `app/lab/wallet-pet` + `components/walletLab` | The grown-up page |
| `public/wallet-lab/*` | Card pictures (`scripts/wallet-lab/make-card-art.mjs`) |
| `scripts/wallet-lab/e2e.mjs` | End-to-end check against a running app |

To test locally without any accounts: run a local chain (e.g. `npx ganache --chain.chainId 31337 --wallet.deterministic`), deploy with `WALLET_LAB_CHAIN_ID=31337 WALLET_LAB_RPC_URL=http://127.0.0.1:8545`, set `WALLET_LAB_MEMORY_STORE=1`, use self-signed stand-in Apple certificates (subject `UID=<pass type id>`, `OU=<team id>`), start `next dev` and run `scripts/wallet-lab/e2e.mjs`.
