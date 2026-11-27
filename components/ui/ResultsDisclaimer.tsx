// One disclaimer for every place that shows a developmental-age range
// (/results and /progress). Wording approved by Kelvin 2026-11-18; have a
// lawyer review it before launch together with the privacy pages.
export const RESULTS_DISCLAIMER =
  "Kailia's Story is a play-based screening and learning tool, not a medical, psychological or " +
  'educational evaluation. The age ranges are rough estimates from a short set of everyday ' +
  "milestones (adapted from public guides such as the CDC's). They cannot diagnose a delay, a " +
  "disability or giftedness, and shouldn't be used to make medical, therapy or school decisions. " +
  'Every child grows at their own pace, and results can change with mood, attention or a new ' +
  "setting. If you have any concern about your child's development, talk with your pediatrician " +
  'or a licensed professional such as an occupational therapist, speech-language pathologist, ' +
  "psychologist, or your child's teacher.";

export default function ResultsDisclaimer({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const dark = tone === 'dark';
  return (
    <div className="rounded-2xl p-5 mb-8 text-sm"
      style={dark
        ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }
        : { background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
      <p className={dark ? 'text-purple-100 leading-relaxed' : 'text-blue-950 text-xs leading-relaxed'}>
        <strong className={dark ? 'text-white' : ''}>About these results.</strong> {RESULTS_DISCLAIMER}
      </p>
    </div>
  );
}
