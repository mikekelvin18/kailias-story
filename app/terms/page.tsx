import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';

export const metadata = { title: 'Terms of Use (Draft) — Kailia\'s Story' };

// Terms of Use, plain language. DRAFT (2026-11-27): written from what the
// app does today, for a lawyer to review and rewrite before launch. Nothing
// here is in effect yet. Open questions are listed in docs/privacy-todo.md.
//
// Placeholders (decide before launch, then replace everywhere they appear):
//   [BUSINESS NAME]  the company that will run the app (not registered yet)
//   [CONTACT EMAIL]  the support / legal contact address
//   [STATE/COUNTRY]  whose law governs these terms

const BUSINESS = '[BUSINESS NAME]';
const CONTACT = '[CONTACT EMAIL]';
const LAW = '[STATE/COUNTRY]';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Who these terms are for',
    body: [
      `These terms are an agreement between ${BUSINESS} ("we") and the parent or guardian who sets up Kailia's Story for their family ("you").`,
      'Children play the games, but the account belongs to the grown-up. By setting up a family you confirm you are 18 or older and the parent or legal guardian of each child you add.',
    ],
  },
  {
    title: 'What the app is, and is not',
    body: [
      'Kailia\'s Story is a play and learning app. Its games give children a chance to practise everyday skills, and its pages give grown-ups simple ideas for playing together.',
      'It is not a medical device and does not diagnose, treat, cure or prevent any condition. The skills check-up and age ranges are a rough guide for choosing games and activities, not a developmental or medical assessment. If you have concerns about your child\'s development, please talk with your pediatrician or a licensed therapist.',
      'Activities off the screen (crafts, movement games, cooking) are for doing with a grown-up watching. Use your own judgment about what is safe for your child.',
    ],
  },
  {
    title: 'Your family\'s information',
    body: [
      'How we handle information is explained in the Privacy Policy, which is part of these terms. In short: your child\'s play stays on your device, and nothing is sold or shared.',
    ],
  },
  {
    title: 'Plans and payments',
    body: [
      'Part of the app is free. Some games, levels and features need a paid plan. What each plan includes and its price are shown on the Plans page, behind a grown-up check. Prices are not set yet.',
      'When payments start, plans will be bought through the App Store or Google Play and follow their rules for renewals, cancelling and refunds. A free trial, if offered, turns into a paid plan only if you do not cancel before it ends; the store will remind you.',
    ],
  },
  {
    title: 'Fair use',
    body: [
      'Please use the app for your family\'s own, non-commercial use. Professionals using a Pro plan may use it with the children they work with, with their parents\' permission.',
      'Please don\'t copy, resell or take apart the app, or use it in a way that harms other people or the service.',
    ],
  },
  {
    title: 'Our content',
    body: [
      `The characters (Kailia, Noel and the friends), stories, pictures, music and games belong to ${BUSINESS}. Printable worksheets may be printed for your own family or, on a Pro plan, for the children you work with.`,
    ],
  },
  {
    title: 'Changes, ending and limits',
    body: [
      'We may update the app and these terms. If a change matters, we will tell you in the app before it takes effect.',
      'You can stop using the app at any time and delete everything from the Family page.',
      `The app is provided as it is. To the extent the law allows, ${BUSINESS} is not liable for indirect losses. Nothing here limits rights you have under consumer law.`,
      `These terms are governed by the laws of ${LAW}.`,
    ],
  },
  {
    title: 'Contact',
    body: [`Questions about these terms: ${CONTACT}.`],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <BackButton href="/family" label="Parent Zone" />
        </div>
        <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: '#FEF3C7', border: '2px dashed #F59E0B' }} data-lawyer-review>
          <p className="text-sm font-extrabold text-amber-900">Draft for lawyer review: not yet in effect.</p>
          <p className="text-sm text-amber-900 mt-0.5">Words in [brackets] are placeholders to fill in before launch.</p>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Terms of Use</h1>
        <p className="text-sm text-gray-600 mb-6">Kailia&apos;s Story · draft version 2026-11-draft-1</p>
        {SECTIONS.map(s => (
          <section key={s.title} className="mb-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-2">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-base text-gray-700 leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
        <p className="text-sm text-gray-600 mt-8">
          Related: <Link href="/privacy" className="underline">Privacy Policy</Link> ·{' '}
          <Link href="/retention" className="underline">Data Retention</Link> ·{' '}
          <Link href="/about" className="underline">About</Link> ·{' '}
          <Link href="/family" className="underline">Parent Zone</Link>
        </p>
      </div>
    </main>
  );
}
