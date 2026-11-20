// No imports: scripts/name-sounds.test.mjs loads this file directly.

/**
 * How the names sound (Kelvin, 2026-11-20): Kailia = "KAI-LEE-yah" ("Kai"
 * rhymes with sky, then "Lee-ya"); Noel = "No-EL" (two beats). Device voices
 * guess "KAY-lee-uh" / "Nole", so lines they read get the names spelled the
 * way they sound. Recorded lines get the same sounds from NAME_SOUNDS in
 * scripts/record-voice.py; scripts/name-sounds.test.mjs checks both.
 */
export function deviceNames(text: string): string {
  return text.replace(/\bKailia/gi, 'Kai-leeya').replace(/\bNoel(?=\b|'s)/gi, 'No-el');
}
