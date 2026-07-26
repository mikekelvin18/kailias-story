// ── Premium entitlement ──
// Whether this family has upgraded. This is account-level (like the family
// account itself), not per-child, so it is NOT in CHILD_DATA_KEYS — it
// describes a purchase, not a child. deleteEverything() in lib/family.ts
// still clears it since it wipes all app storage on full account deletion.
//
// No payment processor is wired up yet. setPremium() is a local placeholder
// so the free/paid gating can be built and tested before real billing
// (Stripe / App Store / Play Store subscriptions) is connected — see /upgrade.

const KEY = 'kailia_premium_v1';

export function isPremium(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === 'true';
}

export function setPremium(value: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, value ? 'true' : 'false');
}

// ── Friends & family codes ──
// A simple, no-backend way to give specific people (like early testers)
// full free access before real billing exists. Add/remove codes here —
// this list ships in the client bundle, so treat it as an honor-system
// gift code, not real access control (anyone could read it from the
// deployed JS). Fine for handing a link to a few friends; not a substitute
// for real entitlement checks once payments are wired up.
const PROMO_CODES = ['KAILIASFRIENDS'];

export function redeemCode(code: string): boolean {
  const ok = PROMO_CODES.includes(code.trim().toUpperCase());
  if (ok) setPremium(true);
  return ok;
}
