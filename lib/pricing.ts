// ── Plans and prices: the ONE file to edit ──
// Everything a family can buy, what each plan includes, and what the
// free part covers, lives here. The /upgrade page, the level map, the
// Quest Library, Printables and the Family page all read this file, so
// changing the split here changes it everywhere.
//
// Prices are left empty on purpose (Kelvin, 2026-11-25: "no prices yet").
// Any price that is null shows "Price coming soon". To set one, type it
// as a string, e.g. monthly: '$9.99'. Real payment is not connected yet;
// see docs/monetization.md for where each limit is enforced in the code.
//
// Nothing here is ever shown to a child: /upgrade and every link to it
// sit behind the grown-up check (components/ParentGate.tsx).

export type PlanId = 'free' | 'family' | 'pro';

export interface PlanPrices {
  monthly: string | null;   // e.g. '$9.99'
  yearly: string | null;    // e.g. '$59.99'
  /** Free trial length in days; 0 or null = no trial. */
  trialDays: number | null;
}

export interface Plan {
  id: PlanId;
  name: string;
  forWho: string;
  prices: PlanPrices | null;   // null = always free
  includes: string[];
  /** Features listed for this plan that are not built yet. Shown with "coming soon". */
  comingSoon?: string[];
}

// ── What the free part covers ──
// Kelvin's rule (2026-11-11, refined 2026-11-25): every game is open, and
// the first FREE_LEVELS levels from where the child STARTS are free, so an
// older child placed further up the ladder gets a fair taste too.
export const FREE = {
  /** Levels free in every game, counted from the child's starting level. */
  levelsPerGame: 5,
  /** 'all' = every quest on the world map is open (levels do the gating).
   *  A number n = only the first n quests of each land are open. */
  questsPerLand: 'all' as 'all' | number,
  /** Today's Quests (Parent & Baby Quest Library) shown each day. */
  dailyTogetherQuests: 3,
  /** How many library quests a free family can browse. */
  libraryPreview: 4,
  /** Printable worksheets free in each category (the first ones). */
  printablesPerCategory: 2,
  /** Child profiles on a free account. */
  childProfiles: 1,
  /** Days the daily care pet task is free before it needs a plan (see lib/carepet). */
  petFreeDays: 3,
};

export const FAMILY_MAX_CHILDREN = 5;

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    forWho: 'Try every skill',
    prices: null,
    includes: [
      `The first ${FREE.levelsPerGame} levels of every game, starting at your child's own level`,
      `${FREE.dailyTogetherQuests} together quests every day`,
      'A sample of the printable worksheets',
      'The skills check-up and results',
      `${FREE.childProfiles} child profile`,
    ],
  },
  {
    id: 'family',
    name: 'Family Premium',
    forWho: 'For the whole family',
    prices: { monthly: null, yearly: null, trialDays: null },
    includes: [
      'Every level of every game, plus the endless star worlds',
      'The daily care pet, every day',
      "Friends' adventures",
      'The full together-quest library and all printables',
      'Progress over time in the parent dashboard',
      `Up to ${FAMILY_MAX_CHILDREN} child profiles`,
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    forWho: 'For OTs, speech therapists, PTs and teachers',
    prices: { monthly: null, yearly: null, trialDays: null },
    includes: [
      'Everything in Family Premium',
      'Unlimited child profiles',
    ],
    comingSoon: [
      'Goals for each child, by skill friend: Flick (hands), Kiko (talking and listening), Shelly (senses and calm), Sage (memory and thinking), Ember (counting), Nova (letters and sounds)',
      'Session notes',
      "Save a child's progress report as a PDF",
      'Classroom mode: switch children in one tap',
    ],
  },
];

export const PRICE_SOON = 'Price coming soon';

export function planById(id: PlanId): Plan {
  return PLANS.find(p => p.id === id)!;
}

/** Child profiles allowed on a plan (Infinity = no limit). */
export function childLimit(premium: boolean): number {
  return premium ? FAMILY_MAX_CHILDREN : FREE.childProfiles;
}
