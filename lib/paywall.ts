// ── Paywall checks that need app content ──
// lib/pricing.ts says WHAT is free; this file answers "is THIS item free?"
// for content lists (worksheets) so pages don't each re-count. Every check
// is open while the paywall is off (PAYWALL_ENABLED in lib/premium.ts).
// Where each check is used: docs/monetization.md.

import { FREE } from './pricing';
import { isPremium } from './premium';
import { WORKSHEETS } from './worksheets';

/** The first FREE.printablesPerCategory sheets of each category are free. */
export function isPrintableFree(id: string): boolean {
  const ws = WORKSHEETS.find(w => w.id === id);
  if (!ws) return true;
  const sameCategory = WORKSHEETS.filter(w => w.category === ws.category);
  return sameCategory.indexOf(ws) < FREE.printablesPerCategory;
}

/** Whether this family can open a printable right now. */
export function canOpenPrintable(id: string): boolean {
  return isPremium() || isPrintableFree(id);
}
