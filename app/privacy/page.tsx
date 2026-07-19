import Link from 'next/link';

export const metadata = { title: 'Privacy Policy (Draft) — Kailia\'s Story' };

// Plain-language privacy policy. DRAFT — must be reviewed by a privacy
// lawyer before launch (COPPA / children's privacy).

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Who this app is for',
    body: [
      'Kailia\'s Story is made for children under 13, which means children\'s privacy laws (like COPPA in the United States) apply to everything we do.',
      'Parents and guardians own the account. Children never create accounts and never enter personal information anywhere in the app.',
    ],
  },
  {
    title: 'What we collect',
    body: [
      'Child profile (created by the parent): a first name or nickname, birth month and year, and a cartoon avatar choice. Never a last name, photo, email address, phone number, or location.',
      'Play measurements: which quests were played, difficulty level, accuracy, number of attempts, and timing (for example, how steadily a path was traced). These estimate developmental progress.',
      'Parent reports: your one-tap answers about daily activities (did it / tried with help / not yet) and assessment questionnaire answers.',
      'Reward progress: starlight points, game levels reached, and companion creatures unlocked — used only to celebrate effort in the story.',
      'Consent record: the date, time, and method of your agreement.',
      'We never record audio, video, or photos of your child. The microphone and camera are never used.',
    ],
  },
  {
    title: 'Why we collect it',
    body: [
      'Only to make the app work: estimating your child\'s developmental level, choosing the right difficulty and activities, and showing you their progress.',
      'We do not use the data for advertising, and we do not build marketing profiles of children.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'No one, except essential service providers needed to run the app (such as website hosting). Today the app stores your child\'s data only on your own device — it is not uploaded to our servers at all.',
      'We never sell data. We never share it with advertisers or data brokers.',
      'There are no third-party analytics or tracking tools in this app.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'Only while your child\'s profile exists. When you delete a profile or your account, all data is erased from this device immediately — and from any future servers within 30 days.',
      'See the Data Retention Policy for details.',
    ],
  },
  {
    title: 'Your rights as a parent',
    body: [
      'In the Parent Zone you can, at any time: view every piece of data stored about your child, delete your child\'s profile and all of its data, or delete your entire account and everything with it.',
      'You can also withdraw consent at any time by deleting your account.',
    ],
  },
  {
    title: 'Contact',
    body: [
      '[Contact email to be added before launch.] Questions about this policy or your child\'s data are always welcome.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen pb-12" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-5">
        <div className="pt-8 pb-2">
          <Link href="/" className="text-sm font-bold text-blue-600">← Home</Link>
        </div>
        <div className="rounded-2xl p-3 mb-5 text-center" style={{ background: '#FEF3C7', border: '2px dashed #F59E0B' }}>
          <p className="text-sm font-extrabold text-amber-800">⚠️ DRAFT — pending legal review. Not yet in effect.</p>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Kailia&apos;s Story · draft version 2026-07-draft-1</p>
        {SECTIONS.map(s => (
          <section key={s.title} className="mb-6">
            <h2 className="text-lg font-extrabold text-gray-800 mb-2">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
        <p className="text-xs text-gray-400 mt-8">
          Related: <Link href="/retention" className="underline">Data Retention Policy</Link> ·{' '}
          <Link href="/family" className="underline">Parent Zone</Link>
        </p>
      </div>
    </main>
  );
}
