# Paid plans: what's free, what's paid, and where the code checks it

Last updated 2026-11-25. Real payment is **not** connected. The paywall is
**off** (`PAYWALL_ENABLED = false` in `lib/premium.ts`), so today every family
gets everything.

## The one file to edit: `src/config/pricing.ts`

| What you want to change | Where in `src/config/pricing.ts` |
| --- | --- |
| A price | `PLANS[...].prices.monthly` / `.yearly`, as text like `'$9.99'`. Empty (`null`) shows "Price coming soon". |
| Free trial length | `PLANS[...].prices.trialDays` (a number of days) |
| How many levels are free per game | `FREE.levelsPerGame` (5) |
| Which world-map quests are open | `FREE.questsPerLand`: `'all'` (now) or a number, e.g. `1` = first quest of each land |
| Free together-quests per day | `FREE.dailyTogetherQuests` (3) |
| Free library quests to browse | `FREE.libraryPreview` (4) |
| Free printables | `FREE.printablesPerCategory` (first 2 of each kind) |
| Child profiles | `FREE.childProfiles` (1), `FAMILY_MAX_CHILDREN` (5) |
| What each plan card lists | `PLANS[...].includes` and `.comingSoon` |

The free part follows Kelvin's rule: **every game is open, and the first 5
levels from where the child starts are free.** Today every game but Word
Wizard starts at level 1; when a game starts older children higher up (the
age-band work), it passes that `startLevel` to `<LevelPath>` and the free
window moves with it.

## Switching charging on

1. Connect real purchases (App Store / Google Play in the phone app).
2. Set `PAYWALL_ENABLED = true` in `lib/premium.ts`.
3. Move hosting off Vercel Hobby (non-commercial only) to Vercel Pro or another commercial host.

To **preview** the paywall on a preview link without switching it on, open any
jump link with `?plus=0`, e.g. `/go/game/moonlight-match?level=5&plus=0`
(gold keys on levels 6+) or `/go/upgrade?plus=0`. Any link with `?plus=1`
turns the preview off again. Jump links don't exist on the real site.

## Every paywalled feature and where it is enforced

| Feature | Free | Paid | Checked in |
| --- | --- | --- | --- |
| Game levels | First 5 from the child's start level | All levels + endless star worlds | `isLevelFree` / `lastFreeLevel` in `lib/premium.ts`, used by `components/LevelPath.tsx` (gold-key stones; a saved level past the free part snaps back to the last free one) |
| World-map quests | All (`FREE.questsPerLand = 'all'`) | All | `isQuestFree` in `lib/adventure.ts`, used by `app/play/page.tsx` |
| Together-quest library | 4 to browse + 3 daily quests | Whole library | `app/activities/page.tsx` (`FREE_LIBRARY_PREVIEW`) |
| Printables | First 2 per category | All | `isPrintableFree` / `canOpenPrintable` in `lib/paywall.ts`, used by `app/printables/page.tsx` and `app/printables/[id]/page.tsx` |
| Child profiles | 1 | 5 (Pro: unlimited, later) | `canAddChild` in `lib/premium.ts`, used by `app/family/page.tsx` |
| Daily care pet task | First 3 days | Every day | `isLocked` in `lib/carepet/engine.ts` via `petLocked` in `lib/kailiaPet.ts` (`freeDays` in the pet config; matches `FREE.petFreeDays`) |
| Friends' adventures, Garden, Story | Open | Open | Not gated today. Friends' adventures are listed as a Family Premium perk: gate them in `app/play/friends` when the paywall goes on, or move them to the free list. |

## Grown-up check

`components/ParentGate.tsx`: hold a button for 3 seconds, then answer a
times-table question. It guards:

- the whole `/upgrade` page and the Family page (`ParentGatePage`), so every link to them is covered
- the gold-key level stones and locked printables (`ParentGateModal`, which then opens `/upgrade`)
- any future link that leaves the app: use `<ParentGateModal href="https://…">`; it opens outside pages only after the check

A pass lasts 10 minutes in that browser tab only (sessionStorage).

## Known gaps

- Games with a "Next level" button on the finish screen (Moonlight Match, Echo Song) jump straight to the next level without the level map, so a child could play one level past the free part before the map's check catches it on the next visit. Fix when the paywall goes on: those buttons should call `isLevelFree` first.
- The care pet's own grown-up check (`components/carepet/CarePet.tsx`) is a simple addition sum; the plans page then asks for the full check again. Swap it for `ParentGateModal` once the pet thread is quiet.
- Plus status lives on the device only (`kailia_premium_v1`). Real purchases need the store's receipt check and a restore button in the phone app.
- Pro (unlimited children, goals, session notes, PDF report, classroom mode) is listed as "coming soon". It needs sign-in accounts, so it waits for the privacy review. Session notes are pick-from-a-list only, never free text about a child (Kelvin, 2026-11-25).

## Seasonal content slots

`lib/seasons.ts` lists four seasonal lands, all off. Each has dates, a name
and a "free for the first week, then a plan" switch. They are not drawn on
the map yet; a land needs its games (existing engines with a seasonal story
deck) before switching one on.
