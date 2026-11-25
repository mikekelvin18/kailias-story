import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';

export const metadata = { title: 'Data Retention Policy (Draft) — Kailia\'s Story' };

// Plain-language retention policy, written from what the app actually
// does (2026-11-25). DRAFT: lawyer review before launch (docs/privacy-todo.md).

const RULES: { title: string; body: string }[] = [
  {
    title: 'What is kept',
    body: 'The child profile you make (nickname, birth month and year, cartoon picture), play numbers from games and quests, your check-up answers and together-quest taps, rewards and pet-friend days, settings, and your consent record. Nothing else.',
  },
  {
    title: 'Where it is kept',
    body: 'Only in this browser on this device. Nothing is uploaded to us, and we keep no copies or backups. Clearing your browser\'s data also erases it.',
  },
  {
    title: 'How long',
    body: 'Only while the child\'s profile exists. The play log keeps at most the last 500 entries per child, so older entries drop off on their own.',
  },
  {
    title: 'Deleting a child\'s profile',
    body: 'Everything stored about that child is erased from this device straight away, including saved worksheet photos if that feature is ever switched on.',
  },
  {
    title: 'Deleting the whole family',
    body: 'Everything goes: consent record, every child profile and all their data, settings, and this device\'s plan status.',
  },
  {
    title: 'If cloud features come later',
    body: 'If the app ever adds sign-in or sync, we will ask for your consent first, and copies on a server will be deleted within 30 days of you deleting them in the app.',
  },
];

export default function RetentionPolicyPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <BackButton href="/" label="Home" />
        </div>
        <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: '#FEF3C7', border: '2px dashed #F59E0B' }}>
          <p className="text-sm font-extrabold text-amber-800">Draft: this page must be reviewed by a lawyer before launch. Not yet in effect.</p>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Data Retention Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Kailia&apos;s Story · draft version 2026-11-draft-2</p>
        <div className="space-y-4">
          {RULES.map(r => (
            <div key={r.title} className="rounded-2xl p-4 bg-white shadow-sm">
              <p className="font-extrabold text-gray-800 mb-1">{r.title}</p>
              <p className="text-base text-gray-700 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-8">
          Related: <Link href="/privacy" className="underline">Privacy Policy</Link> ·{' '}
          <Link href="/family" className="underline">Family page</Link>
        </p>
      </div>
    </main>
  );
}
