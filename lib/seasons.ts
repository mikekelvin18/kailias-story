// ── Seasonal content slots ──
// Room for limited-time lands and decorations (a winter land, a spring
// festival) that a grown-up can switch on later without touching game code.
// Every slot is OFF. A slot only appears when `enabled` is true AND today
// falls between `from` and `to` (month-day, every year; a range can wrap
// over New Year, e.g. 12-01 to 02-28).
//
// Not wired to the map yet on purpose: the map is shared by several
// threads right now. To show a slot, the map reads `activeSeasons()` and
// draws the land's island like any other land (see LANDS in
// lib/adventure.ts). Seasonal lands are a natural Family Premium "content
// drop"; keep them free for at least the first week so everyone gets a taste.

export interface SeasonSlot {
  id: string;
  name: string;          // shown to children, no dates or prices
  from: string;          // 'MM-DD'
  to: string;            // 'MM-DD'
  enabled: boolean;
  /** Game ids (app/play/<id>) that live in this land, reusing existing game engines with a seasonal story deck. */
  games: string[];
  /** Whether the land needs a family plan after its first free week. */
  plusAfterFirstWeek: boolean;
}

export const SEASONS: SeasonSlot[] = [
  { id: 'winter', name: 'Snowglobe Hollow', from: '12-01', to: '02-28', enabled: false, games: [], plusAfterFirstWeek: true },
  { id: 'spring', name: 'Blossom Festival', from: '03-20', to: '05-31', enabled: false, games: [], plusAfterFirstWeek: true },
  { id: 'summer', name: 'Sunny Shore', from: '06-21', to: '08-31', enabled: false, games: [], plusAfterFirstWeek: true },
  { id: 'autumn', name: 'Lantern Harvest', from: '09-22', to: '11-30', enabled: false, games: [], plusAfterFirstWeek: true },
];

function md(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function inSeason(slot: SeasonSlot, date = new Date()): boolean {
  const t = md(date);
  return slot.from <= slot.to ? t >= slot.from && t <= slot.to : t >= slot.from || t <= slot.to;
}

/** Seasonal lands switched on and in season today. */
export function activeSeasons(date = new Date()): SeasonSlot[] {
  return SEASONS.filter(s => s.enabled && inSeason(s, date));
}
