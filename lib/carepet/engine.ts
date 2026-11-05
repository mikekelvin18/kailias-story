// ── Care pet engine ──
// The daily care pet, with no app-specific code inside: no characters,
// no games, no storage keys, no imports. Kailia uses it through
// lib/kailiaPet.ts; the older-adult app (Pip) can use the same file with
// its own adapter and its own numbers in CarePetConfig.
//
// How it works:
//   • Each day the pet asks for ONE need (feed → play → care, rotating),
//     so every skill comes around and a day takes a few minutes.
//   • Doing it makes a "happy day". Happy days grow the pet through its
//     stages (egg → baby → little one → grown up). Growth never goes back.
//   • A missed day only means the pet missed the child. It never gets
//     sick, hungry-sad or dies, and nothing is ever taken away.
//   • Each need has its own difficulty step. Two easy wins in a row raise
//     it one step, a miss lowers it one step, "with help" leaves it alone.
//   • Optional free days: after that many happy days the pet still visits
//     and stays happy, but asks for no new task until the host says the
//     family has paid (the host decides what "paid" means).

export type Need = 'feed' | 'play' | 'care';
export type Outcome = 'win' | 'help' | 'miss';
export type Stage = 'egg' | 'baby' | 'little' | 'grown';

export interface CarePetConfig {
  needs: Need[];                       // rotation order, one per day
  stageAt: { baby: number; little: number; grown: number }; // total happy days
  minStep: number;
  maxStep: number;
  winsToStepUp: number;
  freeDays: number | null;             // null = never asks for payment
  historyLimit: number;                // how many days of history to keep
}

export const DEFAULT_CONFIG: CarePetConfig = {
  needs: ['feed', 'play', 'care'],
  stageAt: { baby: 1, little: 5, grown: 12 },
  minStep: 1,
  maxStep: 6,
  winsToStepUp: 2,
  freeDays: 3,
  historyLimit: 90,
};

export interface DayRecord {
  day: string;        // YYYY-MM-DD, the device's local date
  need: Need;
  step: number;       // difficulty step the task was played at
  outcome: Outcome;
}

export interface CarePetState {
  v: 1;
  startedDay: string;
  lastVisitDay: string | null;
  lastAutoOpenDay: string | null;      // the host's "popped up today" mark
  happyDays: number;                   // total, never decreases
  today: { day: string; need: Need; done: boolean } | null;
  steps: Record<Need, number>;
  winStreak: Record<Need, number>;
  history: DayRecord[];                // newest last
}

export type Greeting = 'hello' | 'missed-you' | 'again';

// ── Dates ──

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Whole calendar days from a to b (both YYYY-MM-DD), ignoring clock time
// and daylight-saving jumps.
export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

// ── Creating and reading ──

function clampStep(step: number, cfg: CarePetConfig): number {
  return Math.min(cfg.maxStep, Math.max(cfg.minStep, Math.round(step)));
}

export function createPet(startStep: number | Record<Need, number>, today: string, cfg: CarePetConfig = DEFAULT_CONFIG): CarePetState {
  const steps = {} as Record<Need, number>;
  const winStreak = {} as Record<Need, number>;
  for (const n of cfg.needs) {
    steps[n] = clampStep(typeof startStep === 'number' ? startStep : startStep[n], cfg);
    winStreak[n] = 0;
  }
  return { v: 1, startedDay: today, lastVisitDay: null, lastAutoOpenDay: null, happyDays: 0, today: null, steps, winStreak, history: [] };
}

// Accepts whatever storage handed back; anything unreadable starts fresh.
export function isPetState(x: unknown): x is CarePetState {
  const s = x as CarePetState;
  return !!s && s.v === 1 && typeof s.happyDays === 'number' && !!s.steps && Array.isArray(s.history);
}

export function stageFor(happyDays: number, cfg: CarePetConfig = DEFAULT_CONFIG): Stage {
  if (happyDays >= cfg.stageAt.grown) return 'grown';
  if (happyDays >= cfg.stageAt.little) return 'little';
  if (happyDays >= cfg.stageAt.baby) return 'baby';
  return 'egg';
}

// ── The daily visit ──

// The need after the one done most recently, so feed → play → care keeps
// rotating even when days are skipped.
function nextNeed(state: CarePetState, cfg: CarePetConfig): Need {
  const last = state.history[state.history.length - 1];
  if (!last) return cfg.needs[0];
  const i = cfg.needs.indexOf(last.need);
  return cfg.needs[(i + 1) % cfg.needs.length];
}

// Call whenever the pet is shown. Rolls over to a new day when the date
// changed and says how the pet should greet the child.
export function visit(state: CarePetState, today: string, cfg: CarePetConfig = DEFAULT_CONFIG): { state: CarePetState; greeting: Greeting } {
  let s = state;
  let greeting: Greeting = 'again';
  if (!s.today || s.today.day !== today) {
    const lastHappy = s.history[s.history.length - 1]?.day;
    greeting = lastHappy && daysBetween(lastHappy, today) >= 2 ? 'missed-you' : 'hello';
    s = { ...s, today: { day: today, need: nextNeed(s, cfg), done: false } };
  }
  return { state: { ...s, lastVisitDay: today }, greeting };
}

// How the pet greets the child right now. Worked out from the saved state
// alone, so asking twice gives the same answer.
export function greetingFor(state: CarePetState, today: string): Greeting | 'first' {
  if (taskDoneToday(state, today)) return 'again';
  const last = state.history[state.history.length - 1]?.day;
  if (!last) return 'first';
  return daysBetween(last, today) >= 2 ? 'missed-you' : 'hello';
}

export function taskDoneToday(state: CarePetState, today: string): boolean {
  return !!state.today && state.today.day === today && state.today.done;
}

// Free days are counted as happy days, so a family that skips days never
// loses trial days. Once used up, today's task is locked unless paid (a
// task already finished today stays finished).
export function isLocked(state: CarePetState, today: string, paid: boolean, cfg: CarePetConfig = DEFAULT_CONFIG): boolean {
  if (paid || cfg.freeDays === null) return false;
  if (taskDoneToday(state, today)) return false;
  return state.happyDays >= cfg.freeDays;
}

// ── Difficulty ──

export function nextStep(step: number, streak: number, outcome: Outcome, cfg: CarePetConfig = DEFAULT_CONFIG): { step: number; streak: number } {
  if (outcome === 'miss') return { step: clampStep(step - 1, cfg), streak: 0 };
  if (outcome === 'help') return { step, streak: 0 };
  const wins = streak + 1;
  if (wins >= cfg.winsToStepUp) return { step: clampStep(step + 1, cfg), streak: 0 };
  return { step, streak: wins };
}

// ── Finishing today's task ──

export interface CompleteResult {
  state: CarePetState;
  grewTo: Stage | null;               // set when this happy day reached a new stage
  stepChange: -1 | 0 | 1;
}

export function completeToday(state: CarePetState, today: string, outcome: Outcome, cfg: CarePetConfig = DEFAULT_CONFIG): CompleteResult {
  const s = state.today && state.today.day === today ? state : visit(state, today, cfg).state;
  if (!s.today || s.today.done) return { state: s, grewTo: null, stepChange: 0 };
  const need = s.today.need;
  const before = s.steps[need];
  const { step, streak } = nextStep(before, s.winStreak[need], outcome, cfg);
  const happyDays = s.happyDays + 1;
  const oldStage = stageFor(s.happyDays, cfg);
  const newStage = stageFor(happyDays, cfg);
  const next: CarePetState = {
    ...s,
    happyDays,
    today: { ...s.today, done: true },
    steps: { ...s.steps, [need]: step },
    winStreak: { ...s.winStreak, [need]: streak },
    history: [...s.history, { day: today, need, step: before, outcome }].slice(-cfg.historyLimit),
  };
  return {
    state: next,
    grewTo: newStage !== oldStage ? newStage : null,
    stepChange: step > before ? 1 : step < before ? -1 : 0,
  };
}

// The host pops the pet up by itself at most once a day.
export function shouldAutoOpen(state: CarePetState, today: string): boolean {
  return state.lastAutoOpenDay !== today && !taskDoneToday(state, today);
}

export function markAutoOpened(state: CarePetState, today: string): CarePetState {
  return { ...state, lastAutoOpenDay: today };
}
