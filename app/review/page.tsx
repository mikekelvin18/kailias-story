import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { jumpLinksEnabled } from '@/lib/jumpGate';
import { LANDS, BONUS_LANDS } from '@/lib/adventure';

// /review: a guide for outside reviewers (people or AI tools) who test the
// preview. No account, no email: every link below is a jump link (lib/jump.ts)
// that makes a made-up test child "Robin" on the reviewer's own device and
// opens straight on that screen. Preview builds only, like /go: the real public
// site answers "not found".

export const metadata: Metadata = {
  title: "Kailia's Story: reviewer guide",
  robots: { index: false, follow: false },
};

type Item = { href: string; label: string; note?: string };

const START: Item[] = [
  { href: '/go/review', label: 'Start here: the world map, everything open', note: 'A 6-year-old test child who finished the check-up. All lands, friends and levels are open.' },
  { href: '/go/home', label: 'Front page', note: 'What a new family sees first.' },
  { href: '/go/story', label: 'Story opening', note: 'The short animated story before the map.' },
  { href: '/go/map', label: 'The map on day one', note: 'Only the first land open, like a brand new player.' },
  { href: '/go/try', label: 'Try one game with no account', note: 'The try-before-sign-up path.' },
  { href: '/go/setup', label: 'First check-up', note: 'The placement games a new child plays (signup already done).' },
];

const PET: Item[] = [
  { href: '/go/pet-popup', label: 'Daily pet: a new egg' },
  { href: '/go/pet-popup?pet=baby', label: 'Daily pet: baby pet' },
  { href: '/go/pet-popup?pet=grown', label: 'Daily pet: grown pet' },
  { href: '/go/pet-popup?pet=little&task=play', label: 'Daily pet: a Play task' },
  { href: '/go/pet-popup?pet=little&task=care', label: 'Daily pet: a Care task' },
  { href: '/go/new-friend', label: 'A new friend joins' },
  { href: '/go/land-done', label: 'Land finished party' },
  { href: '/go/garden', label: "Kailia's Garden" },
  { href: '/go/friends', label: "Friends' adventures" },
  { href: '/go/friend/sage', label: "One friend's trail (Sage the owl)" },
];

const GROWN_UPS: Item[] = [
  { href: '/go/results', label: 'Check-up results', note: 'Developmental age shown as a range, with the not-a-diagnosis note.' },
  { href: '/go/progress', label: 'Progress over time' },
  { href: '/go/family', label: 'Parent Zone', note: 'Child profiles, privacy, see and delete all data.' },
  { href: '/go/activities', label: 'Parent & Baby quests' },
  { href: '/go/printables', label: 'Printable worksheets' },
  { href: '/go/upgrade', label: 'Plus plan page' },
  { href: '/go/map?age=2', label: 'The map for a 2-year-old' },
  { href: '/go/daily-quests', label: "Today's grown-up quests (2-year-old)" },
];

const route = (href: string) => href.replace('/play/', '');

function LinkList({ items }: { items: Item[] }) {
  return (
    <ul className="mt-2 grid gap-2">
      {items.map(i => (
        <li key={i.href}>
          {/* plain <a>: a full page load, so the test child is set up fresh */}
          <a href={i.href} className="block rounded-2xl px-4 py-3 shadow-sm" style={{ background: 'white', color: '#2E1065' }}>
            <span className="block font-bold">{i.label}</span>
            {i.note && <span className="block text-sm mt-0.5" style={{ color: '#5B21B6' }}>{i.note}</span>}
            <span className="block text-xs font-mono mt-1 break-all" style={{ color: '#6D28D9' }}>{i.href}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function ReviewGuide() {
  await connection();
  if (!jumpLinksEnabled()) notFound();
  const lands = [...LANDS, ...BONUS_LANDS];
  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#F5F3FF', color: '#2E1065' }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold">Reviewer guide</h1>
        <p className="mt-3 text-base" style={{ color: '#4C1D95' }}>
          Thanks for testing <b>Kailia&apos;s Story</b>, an adventure game for children that quietly checks
          six skill areas (hand skills, math, reading, talking, senses, memory) and coaches parents.
        </p>
        <p className="mt-2 text-base" style={{ color: '#4C1D95' }}>
          <b>No account or email needed.</b> Every link below makes a made-up test child called Robin on your own
          device and opens straight on that screen. Nothing is sent to a server. Opening a link starts Robin fresh,
          so you can jump around freely.
        </p>

        {/* full page load on purpose: the test child is set up fresh */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/go/review" className="mt-5 block text-center rounded-2xl px-5 py-4 text-xl font-extrabold shadow"
          style={{ background: '#6D28D9', color: 'white' }}>
          Start playing →
        </a>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Start of the app</h2>
          <LinkList items={START} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Every game</h2>
          <p className="text-sm mt-1" style={{ color: '#5B21B6' }}>
            Each opens on level 1. Change <b>?level=1</b> in the address to any number to jump to a harder level.
          </p>
          {lands.map(land => (
            <div key={land.id} className="mt-4">
              <h3 className="font-extrabold" style={{ color: '#4C1D95' }}>{land.name} <span className="font-normal text-sm">({land.domain})</span></h3>
              <LinkList items={land.quests.map(q => ({ href: `/go/game/${route(q.href)}?level=1`, label: q.title, note: q.desc }))} />
            </div>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Daily pet, friends and rewards</h2>
          <LinkList items={PET} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Grown-up pages</h2>
          <LinkList items={GROWN_UPS} />
        </section>

        <section className="mt-8 rounded-2xl px-4 py-4" style={{ background: '#EDE9FE' }}>
          <h2 className="text-lg font-extrabold">Good to know</h2>
          <ul className="mt-2 list-disc pl-5 text-base grid gap-1" style={{ color: '#4C1D95' }}>
            <li>Add <b>?age=3</b> to any link to play as a 3-year-old, or <b>?buddy=sage</b> to pick a different friend.</li>
            <li>Children never see scores, timers or a paywall. Results and plans are on grown-up pages only.</li>
            <li>Sound is on. Most lines are read aloud by Noel the panda.</li>
            <li>This is a test build. The real public site does not have these links.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
