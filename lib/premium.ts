// ── Premium entitlement ──
// Whether this family has upgraded. This is account-level (like the family
// account itself), not per-child, so it is NOT in CHILD_DATA_KEYS — it
// describes a purchase, not a child. deleteEverything() in lib/family.ts
// still clears it since it wipes all app storage on full account deletion.
//
// No payment processor is wired up yet. setPremium() is a local placeholder
// so the free/paid gating can be built and tested before real billing
// (Stripe / App Store / Play Store subscriptions) is connected — see /upgrade.

import { FREE, childLimit } from '../src/config/pricing';

const KEY = 'kailia_premium_v1';

// ── Launch mode ──
// Flip this to true only once you're confident the app is actually helping
// kids and parents and you're ready to start charging. While it's false,
// everything is unlocked for everyone — the paywall UI (locked quests,
// /upgrade, library limit) all still exist and can be tested, but nobody
// visiting the real site is ever gated behind them.
const PAYWALL_ENABLED = false;

/** True once real charging is switched on (PAYWALL_ENABLED). */
export function isPaywallOn(): boolean {
  return PAYWALL_ENABLED || paywallPreview();
}

// Preview builds only: a /go link with ?plus=0 sets this so a reviewer can
// see the free part with the paywall "on" (lib/jump.ts). Jump links don't
// exist on the real site, and the flag can only ever lock MORE, never less.
function paywallPreview(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem('kailia_paywall_preview_v1') === 'on'; } catch { return false; }
}

export function isPremium(): boolean {
  if (!isPaywallOn()) return true;
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

// ── The free part, read from lib/pricing.ts ──

/** A level is free when it sits within the first FREE.levelsPerGame levels
 *  from where this child starts the game (startLevel = 1 unless the game
 *  places older children further up the ladder). Levels below the start
 *  are always open too: going back down is never locked. */
export function isLevelFree(level: number, startLevel = 1): boolean {
  return level < Math.max(1, startLevel) + FREE.levelsPerGame;
}

/** Highest level a family without a plan can play in a game. */
export function lastFreeLevel(startLevel = 1): number {
  return Math.max(1, startLevel) + FREE.levelsPerGame - 1;
}

/** Whether one more child profile fits this family's plan. */
export function canAddChild(currentCount: number): boolean {
  if (!isPaywallOn()) return true;
  return currentCount < childLimit(isPremium());
}
