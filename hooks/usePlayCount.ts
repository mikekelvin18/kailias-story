const KEY = 'kailias_play_count';
const REASSESS_THRESHOLD = 10;

function getCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(KEY) ?? '0', 10);
}

export function usePlayCount() {
  const increment = (): number => {
    const next = getCount() + 1;
    localStorage.setItem(KEY, String(next));
    return next;
  };

  const reset = () => localStorage.setItem(KEY, '0');

  const count = getCount();
  const needsReassessment = count > 0 && count % REASSESS_THRESHOLD === 0;

  return { count, increment, reset, needsReassessment };
}
