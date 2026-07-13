import Link from 'next/link';

export const metadata = { title: 'Data Retention Policy (Draft) — Kailia\'s Story' };

// Plain-language retention policy. DRAFT — pending legal review.

const RULES: { emoji: string; title: string; body: string }[] = [
  {
    emoji: '📦', title: 'What we keep',
    body: 'The child profile a parent creates (nickname, birth month/year, avatar), play measurements from quests, parent activity reports, and the parent\'s consent record. Nothing else.',
  },
  {
    emoji: '⏳', title: 'How long we keep it',
    body: 'Only while the child\'s profile is active. Data is kept for no longer than it is needed to show your child\'s progress — and never for advertising or profiling.',
  },
  {
    emoji: '🗑️', title: 'When you delete a profile',
    body: 'All of that child\'s data is erased from your device immediately. If the app gains cloud features in the future, any server copies will be permanently deleted within 30 days at the latest.',
  },
  {
    emoji: '🚪', title: 'When you delete your account',
    body: 'Everything goes: consent record, child profiles, and every measurement. Same rule — immediate on your device, within 30 days on any future servers.',
  },
  {
    emoji: '📱', title: 'Where data lives today',
    body: 'Right now, all data is stored only on your own device (in your browser\'s storage). We do not upload it. Clearing your browser data also erases it.',
  },
  {
    emoji: '🔒', title: 'Backups',
    body: 'We keep no backups of child data today. If backups exist in the future, deleted data will also be purged from them within the same 30-day window.',
  },
];

export default function RetentionPolicyPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <Link href="/" className="text-sm font-bold text-blue-600">← Home</Link>
        </div>
        <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: '#FEF3C7', border: '2px dashed #F59E0B' }}>
          <p className="text-sm font-extrabold text-amber-800">⚠️ DRAFT — pending legal review. Not yet in effect.</p>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Data Retention Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Kailia&apos;s Story · draft version 2026-07-draft-1</p>
        <div className="space-y-4">
          {RULES.map(r => (
            <div key={r.title} className="rounded-2xl p-4 bg-white shadow-sm">
              <p className="font-extrabold text-gray-800 mb-1">{r.emoji} {r.title}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-8">
          Related: <Link href="/privacy" className="underline">Privacy Policy</Link> ·{' '}
          <Link href="/family" className="underline">Parent Zone</Link>
        </p>
      </div>
    </main>
  );
}
