import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { jumpLinksEnabled } from '@/lib/jumpGate';
import { AGE_BANDS, BAND_SETTINGS, bandForMonths, type AgeBand } from '@/lib/ageBands';
import { FIT_GAMES, fitStartLevel, tierForMonths, judge } from '@/lib/ageFit';
import {
  cargoPlan, echoSeqLen, mazeCorridor, moonPairs, skyMathKind, snackAgeCap, snackMode,
} from '@/lib/gameCurves';

// /review/ages: every game's settings per age band, side by side, so Kelvin
// (and a clinician) can check them (Grok's review 2026-11-25). Preview builds
// only, like /review and /go. Each cell links to that game opened as a child
// of that age would see it.

export const metadata: Metadata = {
  title: 'Kailia’s Story: games by age',
  robots: { index: false, follow: false },
};

// a typical child in each band, in months
const SAMPLE: Record<AgeBand, number> = { together: 30, little: 48, early: 72, big: 96, older: 120 };

const SKY: Record<string, string> = {
  count3: 'give 1, 2 or 3', count5: 'count to 5', addPics: 'add with pictures', add10: 'sums within 10',
  addSub10: '+ and − within 10', addSub20: '+ and − within 20', times: 'times tables', timesDiv: 'times and sharing',
};

function startNote(id: string, L: number, m: number): string {
  const t = tierForMonths(m);
  switch (id) {
    case 'moonlight-match': return `${moonPairs(L, t, m)} pairs`;
    case 'echo-song': return `${echoSeqLen(L, t)} notes`;
    case 'fine-motor': return `path ${mazeCorridor(L, t, m)} wide`;
    case 'snack-quest': {
      const mode = snackMode(m);
      return `wishes up to ${snackAgeCap(m, t)}${mode === 'twoMore' ? ', “bring 2 more”' : mode === 'howManyMore' ? ', “how many MORE?”' : ''}`;
    }
    case 'sky-mail': return `${SKY[skyMathKind(m)]}${m >= BAND_SETTINGS.big.fromMonths ? ', Tricky Wind' : ''}`;
    case 'cargo-count': { const p = cargoPlan(L, t); return `orders ${p.lo}–${p.hi}, boxes ${p.values.join('/')}`; }
    case 'word-wizard': { const r = BAND_SETTINGS[bandForMonths(m)].reading; return r === 'none' ? 'pictures only' : r === 'cvc' ? '3-letter words' : 'words and sentences'; }
    default: return '';
  }
}

const years = (m: number) => (m % 12 === 0 ? `${m / 12}` : `${Math.floor(m / 12)}½`);
const ROUTE: Record<string, string> = { 'word-wizard': 'word-wizard', 'sense-explorer': 'sense-explorer' };

export default async function AgesReview() {
  await connection();
  if (!jumpLinksEnabled()) notFound();
  const rows: { k: string; v: (b: AgeBand) => string }[] = [
    { k: 'Ages', v: b => BAND_SETTINGS[b].ages },
    { k: 'Smallest tap', v: b => `${BAND_SETTINGS[b].minTap}px` },
    { k: 'Speed', v: b => `${BAND_SETTINGS[b].speed}×` },
    { k: 'Most choices', v: b => `${BAND_SETTINGS[b].maxChoices}` },
    { k: 'Path wiggle room', v: b => `${BAND_SETTINGS[b].pathTolerance}px` },
    { k: 'Tap to move', v: b => (BAND_SETTINGS[b].tapToMove ? 'yes' : 'no') },
    { k: 'Timers', v: b => BAND_SETTINGS[b].timers },
    { k: 'Reading', v: b => ({ none: 'pictures only', cvc: '3-letter words', sentences: 'sentences', longer: 'longer text' })[BAND_SETTINGS[b].reading] },
    { k: 'Math', v: b => ({ find12: 'find 1–2', count5: 'count to 5', count10: 'count to 10, 2 more', addSub20: '± within 20', timesWords: '× and word problems' })[BAND_SETTINGS[b].math] },
    { k: 'Memory pairs', v: b => `${BAND_SETTINGS[b].memoryPairs}` },
  ];
  const cell = { padding: '6px 8px', borderBottom: '1px solid #E9D5FF', verticalAlign: 'top' as const };
  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#F5F3FF', color: '#2E1065' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-extrabold">Games by age band</h1>
        <p className="mt-1 text-sm">
          Settings live in <code>lib/ageBands.ts</code>; each game&apos;s level curve in <code>lib/gameCurves.ts</code>;
          starting levels in <code>lib/ageFit.ts</code>. Bands come from the check-up for that game&apos;s skill (else
          the real age), moved a year by Family → Game level. Tap a cell to open the game as a child that age.
        </p>

        <h2 className="text-lg font-extrabold mt-6">Band settings</h2>
        <div className="overflow-x-auto mt-2 rounded-2xl bg-white">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead><tr><th style={cell}></th>{AGE_BANDS.map(b => <th key={b} style={cell} className="text-left">{BAND_SETTINGS[b].label}</th>)}</tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.k}><th style={cell} className="text-left whitespace-nowrap">{r.k}</th>{AGE_BANDS.map(b => <td key={b} style={cell}>{r.v(b)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>

        <h2 className="text-lg font-extrabold mt-6">Where each game starts</h2>
        <p className="text-sm">For a typical child in each band (on track). Level, then what it asks; ✓ just right, ↓ easy start, ↑ hard.</p>
        <div className="overflow-x-auto mt-2 rounded-2xl bg-white">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead><tr><th style={cell} className="text-left">Game</th>{AGE_BANDS.map(b => <th key={b} style={cell} className="text-left">{BAND_SETTINGS[b].label} ({years(SAMPLE[b])})</th>)}</tr></thead>
            <tbody>{FIT_GAMES.map(g => (
              <tr key={g.id}>
                <th style={cell} className="text-left">{g.title}<span className="block text-xs font-normal">{g.skill}</span></th>
                {AGE_BANDS.map(b => {
                  const m = SAMPLE[b];
                  const L = fitStartLevel(g.id, m);
                  const v = judge(g.demand(L, tierForMonths(m), m), m);
                  const note = startNote(g.id, L, m);
                  const route = ROUTE[g.id] ?? g.id;
                  return (
                    <td key={b} style={cell}>
                      <a href={`/go/game/${route}?age=${years(m).replace('½', '.5')}`} className="underline" style={{ color: '#6D28D9' }}>
                        {g.leveled ? `L${L}` : 'bag'} {v === 'good' ? '✓' : v === 'easy' ? '↓' : '↑'}
                      </a>
                      {note && <span className="block text-xs">{note}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs">Every game also steps up a level after 3 easy wins and quietly back after 2 struggles. Grown-ups can pick any level under the level map.</p>
      </div>
    </main>
  );
}
