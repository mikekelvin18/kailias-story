// A fair shuffle (Fisher–Yates). `array.sort(() => Math.random() - 0.5)`
// is NOT fair: the browser's sort keeps items near where they started, so
// the last entries of a list (e.g. the squirrel, 10th of 10 creatures in
// Moonlight Match) almost never got picked (Muse round 5).
export function shuffled<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
