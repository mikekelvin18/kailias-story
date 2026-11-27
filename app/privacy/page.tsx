import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';

export const metadata = { title: 'Privacy Policy (Draft) — Kailia\'s Story' };

// Plain-language privacy policy, written from what the app actually does
// (2026-11-25). DRAFT: must be reviewed by a privacy lawyer before launch
// (COPPA / children's privacy). Open questions: docs/privacy-todo.md.

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'The short version',
    body: [
      'Your child\'s play stays on your own phone, tablet or computer. We do not have a server that receives it.',
      'We never record your child\'s voice, face or photo. The app never turns on the microphone or camera.',
      'There are no ads, no tracking tools and no analytics companies in this app. We never sell or share information.',
      'You can see everything stored about your child, and delete it in one tap, in the Family page.',
    ],
  },
  {
    title: 'Who this app is for',
    body: [
      'Kailia\'s Story is made for children under 13, so children\'s privacy laws (like COPPA in the United States) apply to everything in it.',
      'A parent or guardian sets up the family and each child\'s profile. Children never create accounts and never type personal information anywhere in the app.',
    ],
  },
  {
    title: 'What is stored, and where',
    body: [
      'Everything below is stored only in this browser on this device. Clearing the browser\'s data or deleting the profile erases it.',
      'Child profile (made by you): a first name or nickname, birth month and year, and a cartoon picture. Never a last name, photo, email, phone number, school or location.',
      'Play numbers: which game or quest was played, the level, how many were right, how many tries, and how long it took (for example, how steadily a path was traced). The app uses these to pick the right level and to show you progress.',
      'Your answers: the skills check-up questions you answer, and your one-tap notes on together quests (did it, tried with help, not yet).',
      'Rewards and the pet friend: starlight points, levels reached, friends unlocked, and which days the pet friend got its daily task.',
      'Printables: which sheet was marked done and the date. Photo upload is switched off.',
      'Settings: sound, music, read-aloud, calm mode and similar choices, and whether this device has a family plan.',
      'Your consent: the date, time and way you agreed, and which version of this policy you agreed to.',
    ],
  },
  {
    title: 'What we never collect',
    body: [
      'No audio, video or photos of your child. No microphone or camera access.',
      'No free-text notes about your child, no contacts, no location, no advertising IDs and no device fingerprinting.',
    ],
  },
  {
    title: 'Voices and sounds',
    body: [
      'Noel\'s and the friends\' voices are recordings that ship with the app. Playing them sends nothing anywhere.',
      'A few lines say your child\'s nickname. Those use a voice built into your device, and the app only picks voices that work offline on the device, so the name is not sent to an online voice service.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'No one. Child data is not uploaded, so there is nothing for us to share.',
      'Our website host (Vercel) delivers the app\'s pages and, like every website host, sees basic technical details of each visit, such as an IP address and browser type, in its own short-lived logs. It never receives your child\'s profile or play numbers.',
      'When paid plans arrive, purchases will go through Apple\'s App Store or Google Play, which handle payment. We will not receive card details, and buying is always behind a grown-up check.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'Only while your child\'s profile exists on this device. Deleting a profile or the whole family erases that data from this device straight away.',
      'See the Data Retention page for details.',
    ],
  },
  {
    title: 'Your rights as a parent',
    body: [
      'In the Family page you can, at any time: see every piece of data stored about your child, delete your child\'s profile and all of its data, or delete the whole family and everything with it.',
      'Deleting the family also withdraws your consent.',
    ],
  },
  {
    title: 'Grown-up checks',
    body: [
      'Plans, prices and any link that leaves the app sit behind a grown-up check (hold a button for 3 seconds, then answer a times-table question). Passing it is remembered for 10 minutes in this browser tab only.',
    ],
  },
  {
    title: 'Changes and contact',
    body: [
      'If this policy changes in a way that affects your child\'s data, we will ask for your consent again in the app before anything new is collected.',
      '[Contact email to be added before launch.] Questions about this policy or your child\'s data are always welcome.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <BackButton href="/" label="Home" />
        </div>
        <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: '#FEF3C7', border: '2px dashed #F59E0B' }}>
          <p className="text-sm font-extrabold text-amber-800">Draft: this page must be reviewed by a lawyer before launch. Not yet in effect.</p>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Kailia&apos;s Story · draft version 2026-11-draft-2</p>
        {SECTIONS.map(s => (
          <section key={s.title} className="mb-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-2">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-base text-gray-700 leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
        <p className="text-xs text-gray-400 mt-8">
          Related: <Link href="/retention" className="underline">Data Retention Policy</Link> ·{' '}
          <Link href="/family" className="underline">Family page</Link> ·{' '}
          <Link href="/about" className="underline">About us</Link>
        </p>
      </div>
    </main>
  );
}
