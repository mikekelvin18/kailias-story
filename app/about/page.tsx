import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { LANDS } from '@/lib/adventure';
import { SKILL_INFO } from '@/lib/skillInfo';
import { GatedLink } from '@/components/ParentGate';

export const metadata = { title: 'About Kailia\'s Story' };

// ── About / trust page (grown-ups) ──
// Who made the app, who it is built with, what each game practises, and a
// plain statement that the app does not diagnose or treat anything. Keep
// claims modest: say what a game PRACTISES, never that it improves
// development, until a real study shows it.

// game page → its notes in lib/skillInfo.ts (a few pages have older names)
const INFO_KEY: Record<string, string> = { reading: 'word-wizard', sensory: 'sense-explorer' };

// Placeholders for the professionals who review the app. Fill in name,
// credential and one line each once they agree to be named.
const ADVISORS: { role: string; name: string | null; line: string | null }[] = [
  { role: 'Occupational therapist (OT)', name: null, line: null },
  { role: 'Speech-language pathologist (SLP)', name: null, line: null },
];

const plain = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim();

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <BackButton href="/" label="Home" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">About Kailia&apos;s Story</h1>
        <p className="text-base text-gray-700 leading-relaxed mb-6">
          Kailia&apos;s Story is a play adventure for young children and the grown-ups who love them. It was
          inspired by a real little girl named Kailia. Children play short games with Kailia and her panda friend
          Noel, and grown-ups get simple ideas for playing together off the screen.
        </p>

        <section className="rounded-2xl p-4 mb-6" style={{ background: '#EEF2FF', border: '2px solid #C7D2FE' }}>
          <h2 className="text-lg font-extrabold text-indigo-950 mb-1">Not a diagnosis or treatment</h2>
          <p className="text-base text-indigo-950 leading-relaxed">
            Kailia&apos;s Story does not diagnose, treat or cure any condition, and it is not a medical or
            developmental assessment. The skills check-up gives a rough guide for choosing games and activities.
            If you have any concerns about your child&apos;s development, talk with your pediatrician or a
            licensed therapist.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-extrabold text-gray-800 mb-2">Built with input from</h2>
          <ul className="space-y-2">
            {ADVISORS.map(a => (
              <li key={a.role} className="rounded-2xl p-4 bg-white shadow-sm">
                <p className="font-extrabold text-gray-800">{a.role}</p>
                <p className="text-base text-gray-600">{a.name ? `${a.name}. ${a.line ?? ''}` : 'To be added.'}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            The check-up questions are adapted from public milestone guides, such as the CDC&apos;s{' '}
            <GatedLink href="https://www.cdc.gov/ncbddd/actearly/milestones/index.html" className="underline font-semibold text-violet-700">
              &quot;Learn the Signs. Act Early.&quot; milestones
            </GatedLink>. They are not copied from paid clinical tests.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-extrabold text-gray-800 mb-2">What each game practises</h2>
          <p className="text-base text-gray-600 mb-3">
            These are the skills each game gives children a chance to practise. We don&apos;t claim a game
            improves development on its own: everyday play with you matters most.
          </p>
          {LANDS.map(land => (
            <div key={land.id} className="mb-4">
              <h3 className="font-extrabold text-gray-800 mb-1">{land.name}</h3>
              <ul className="space-y-2">
                {land.quests.map(q => {
                  const page = q.href.replace('/play/', '');
                  const info = SKILL_INFO[INFO_KEY[page] ?? page];
                  return (
                    <li key={q.href} className="rounded-2xl p-3 bg-white shadow-sm">
                      <p className="font-bold text-gray-800">{q.title}</p>
                      {info ? (
                        <>
                          <p className="text-sm font-semibold text-violet-700">{info.skills.map(plain).join(' · ')}</p>
                          <p className="text-sm text-gray-600 leading-snug mt-0.5">{info.builds}</p>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-extrabold text-gray-800 mb-2">Our promises</h2>
          <ul className="list-disc pl-5 space-y-1 text-base text-gray-700">
            <li>No ads, ever, and no tracking or analytics companies.</li>
            <li>Your child&apos;s play stays on your device. We never sell or share information.</li>
            <li>No microphone, camera or photos of your child.</li>
            <li>Children never see a price. Plans and outside links are behind a grown-up check.</li>
            <li>No guilt: the pet friend never gets sick or sad, and missing a day is always fine.</li>
          </ul>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          <Link href="/privacy" className="underline">Privacy Policy</Link> ·{' '}
          <Link href="/retention" className="underline">Data Retention</Link> ·{' '}
          <Link href="/terms" className="underline">Terms of Use (draft)</Link> ·{' '}
          <Link href="/family" className="underline">Family page</Link>
        </p>
      </div>
    </main>
  );
}
