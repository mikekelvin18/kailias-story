# Privacy and kids'-store check: findings and open questions

Last updated 2026-11-25. The privacy and data-retention pages (`/privacy`,
`/retention`) were rewritten from what the app actually does and are marked
**Draft: lawyer review before launch**.

## Kids' store rules check (Apple Kids category, Google Play Families, COPPA)

Checked: every dependency in `package.json`, every outside link and network
call in `app/`, `components/`, `lib/`, and every child-reachable input.

### Passes

- **No ads, no analytics, no tracking SDKs.** Dependencies are Next.js and React, plus the wallet-lab packages (see below). No pixels, session replay or crash reporters.
- **No outside links on child screens.** None found. `ParentGateModal` (`components/ParentGate.tsx`) is ready for any future one.
- **No microphone, camera or location.** No `getUserMedia`, no geolocation. Worksheet photo upload stays switched off.
- **Fonts are self-hosted** (`next/font` downloads them at build time; the browser never calls Google).
- **Network calls** are only to the app's own files (voice manifests and recordings).
- **Jump links and the reviewer page** (`/go`, `/review`) only work on preview builds.

### Fixed in this change

- **The plans page had no grown-up check**, and its friends-and-family code box was a text input a child could reach. The whole page is now behind the hold-3-seconds-plus-times-table check.
- **Online speech voices.** On Edge and Chrome the "best" device voice could be an online one (Microsoft "Online (Natural)", "Google …"), which sends the spoken text to Microsoft or Google. Some lines say the child's nickname. The app now only uses voices that run on the device (`lib/voice.ts`), and stays quiet if there is none.
- **"Delete everything" left settings behind** (sound, theme, plan status). It now removes every `kailia_` key from the device (`lib/family.ts`).

### Still open (would break a rule, or might)

1. **Wallet lab is in the build.** `@erc8426/*`, `viem` and `@upstash/redis` plus `/api/wallet-lab`, `/wallet-pass`, `/wallet-apple` ship in every build, though switched off (`WALLET_LAB_ENABLED`). Apple reviews Kids-category apps for anything crypto-related. **Kelvin decided 2026-11-25: no crypto wallet** — leave the wallet lab out of the phone-app build entirely.
2. **Family page grown-up check:** done 2026-11-25 (Kelvin said yes). `/family` is wrapped in `ParentGatePage`.
3. **The care pet's grown-up check is a simple addition sum** (`components/carepet/CarePet.tsx`), easy for a 6-year-old. Swap for the shared check.
4. **No contact email** in `/privacy` or `SECURITY.md`. COPPA requires the operator's name and contact details in the policy.
5. **Vercel Hobby is for non-commercial use.** Move to a paid or commercial host before charging.
6. **"Child's goal" is a free-text box about the child** (Family page, custom quests in `lib/customTasks.ts`, e.g. "Say thank you at dinner"). Rule 1 in CLAUDE.md forbids free-text fields about a child. It stays on the device, but ask the lawyer, or switch it to pick-from-a-list.
7. **Friends-and-family code** lives in the app's code (`lib/premium.ts`), so anyone can read it. Fine for a few testers, not for launch.

## Questions for Kelvin (and the lawyer)

1. **Who is the "operator"?** (Kelvin 2026-11-25: business name and contact email come when he registers the company; placeholders stay until then.) COPPA policies must name the company or person running the app, with a postal address, email and phone. Will you form a company (an LLC) before launch?
2. **Consent method.** Today a parent ticks a box. Because child data never leaves the device, the lawyer may say this is enough. When accounts or sync arrive, consent needs a stronger check (for example a card check at purchase). Confirm with the lawyer.
3. **Pro session notes:** decided 2026-11-25 (Kelvin): pick-from-a-list only, never free text about a child.
4. **Pro for therapists** means children's data on a server, possibly health information (HIPAA if clinics use it). Budget for the lawyer before building Pro.
5. **App store privacy labels.** Apple's "nutrition label" and Google's Data safety form: with no data leaving the device, both can say "No data collected". Confirm once the phone-app wrapper is chosen.
6. **Privacy policy link in the stores.** Both stores need a public privacy-policy URL; `/privacy` will be it once reviewed.
7. **Health claims.** The About page and results pages say the app practises skills and does not diagnose or treat. Keep marketing (store text, website) to the same wording.
8. **Worksheet photos** stay off. Turning them on needs its own lawyer review (rule 4 in CLAUDE.md).
