import type { Metadata } from 'next';
import TestModeState from '@/components/TestModeState';
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
  { href: '/go/map', label: 'The map on day one (starts fresh)', note: 'Only the first land open, like a brand new player.' },
  { href: '/go/try', label: 'Try one game with no account (starts fresh)', note: 'The try-before-sign-up path.' },
  { href: '/review/ages', label: 'Games by age band', note: 'Every game’s settings and starting level for under 3s, 3–4, 5–6, 7–8 and 9–12, side by side.' },
  { href: '/go/setup', label: 'First check-up (starts fresh)', note: 'The placement games a new child plays (signup already done).' },
];

const PET: Item[] = [
  { href: '/go/pet-popup', label: 'Daily pet: a new egg' },
  { href: '/go/pet-popup?pet=baby', label: 'Daily pet: baby pet' },
  { href: '/go/pet-popup?pet=grown', label: 'Daily pet: grown pet' },
  { href: '/go/pet-popup?pet=little&task=play', label: 'Daily pet: a Play task' },
  { href: '/go/pet-popup?pet=little&task=care', label: 'Daily pet: a Care task' },
  { href: '/go/new-friend', label: 'A new friend joins (starts fresh)' },
  { href: '/go/land-done', label: 'Land finished party (starts fresh)' },
  { href: '/go/garden', label: "Kailia's Garden" },
  { href: '/go/friends', label: "Friends' adventures" },
  { href: '/go/friend/sage', label: "One friend's trail (Sage the owl)" },
];

const FEELINGS: Item[] = [
  { href: '/go/talk?place=story-sparks&age=4', label: '"Your turn!" talking moment, age 4 (one word)', note: 'Kailia pauses for the child to talk. Nothing is recorded; a grown-up can tap Said it / Tried / Not yet.' },
  { href: '/go/talk?place=story-sparks&age=2', label: '"Your turn!" age 2 (animal sounds)' },
  { href: '/go/talk?place=trail-walk&age=6', label: '"Your turn!" age 6 (phrases, what happens next)' },
  { href: '/go/talk?place=echo-song&age=8', label: '"Your turn!" age 8 (tell it in your own words)' },
  { href: '/go/feelings?land=dragons-cave', label: 'Feelings check-in after a land', note: 'Tap Worried or Sad for the breathing bubble with Noel.' },
  { href: '/go/break', label: 'Break reminder with a movement quest' },
  { href: '/go/done-today', label: '"Done for today" cozy ending' },
];

const GROWN_UPS: Item[] = [
  { href: '/go/results', label: 'Check-up results', note: 'Strengths first (Shining at, Growing in, Try next); the rough age range is under Details.' },
  { href: '/go/senses', label: 'Parent Zone: senses, talking and breaks', note: 'Voice, effects and music volume, Gentle sounds, Low visual, vibration, talking pauses, break reminders, Done for today.' },
  { href: '/go/talk-cards', label: 'Printable Talking practice cards' },
  { href: '/go/progress', label: 'Progress over time' },
  { href: '/go/family', label: 'Parent Zone', note: 'Child profiles, privacy, see and delete all data.' },
  { href: '/go/activities', label: 'Parent & Baby quests' },
  { href: '/go/printables', label: 'Printable worksheets' },
  { href: '/go/upgrade', label: 'Plans page', note: 'Free, Family Premium and Pro side by side, behind the grown-up check (hold 3 seconds, then a times-table sum).' },
  { href: '/go/about', label: 'About page', note: 'Who it is built with, what each game practises, not-a-diagnosis note.' },
  { href: '/go/terms', label: 'Terms of Use (draft)', note: 'Plain-language draft marked for lawyer review; placeholders in [brackets].' },
  { href: '/go/map?age=2', label: 'The map for a 2-year-old (starts fresh)' },
  { href: '/go/daily-quests', label: "Today's grown-up quests, 2-year-old (starts fresh)" },
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
          device and opens straight on that screen. Nothing is sent to a server. After you press Start, Robin keeps
          their progress as you follow the links (every level of every game is open). The few links marked
          &ldquo;starts fresh&rdquo; set the same Robin up from scratch for that one screen; the next ordinary
          link gives Robin their progress back. There is only ever one Robin.
        </p>

        {/* full page load on purpose: the test child is set up (once) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/go/review" className="mt-5 block text-center rounded-2xl px-5 py-4 text-xl font-extrabold shadow"
          style={{ background: '#6D28D9', color: 'white' }}>
          Start playing →
        </a>

        {/* reviewers' test mode (lib/testMode.ts): tap instead of drag */}
        <section className="mt-8 rounded-2xl px-4 py-4 bg-white" data-test-mode>
          <h2 className="text-lg font-extrabold">Test mode: tap instead of drag</h2>
          <p className="text-sm mt-1" style={{ color: '#5B21B6' }}>
            For testers only (this build). Garden, Maze Runner and Potion Sort use a steady drag. Test mode turns on the
            tap-to-move the youngest children get: in Maze Runner tap further along the path and Kailia walks there; in
            Potion Sort tap a potion, then its cauldron; in the Garden tap a thing, then where it goes. It lasts until
            this browser tab is closed.
          </p>
          <TestModeState />
          <LinkList items={[
            { href: '/go/test-mode', label: 'Turn test mode on' },
            { href: '/go/garden?test=tap', label: "Kailia's Garden, test mode" },
            { href: '/go/game/fine-motor?level=1&test=tap', label: 'Maze Runner, test mode' },
            { href: '/go/game/potion-sort?level=1&test=tap', label: 'Potion Sort, test mode' },
            { href: '/go/test-mode?on=0', label: 'Turn test mode off' },
          ]} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Start of the app</h2>
          <LinkList items={START} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Every game</h2>
          <p className="text-sm mt-1" style={{ color: '#5B21B6' }}>
            Each opens on level 1, and every level is open on the game&apos;s level map. Change <b>?level=1</b> in the
            address to any number to jump straight to a harder level.
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
          <h2 className="text-lg font-extrabold">Talking, feelings and breaks</h2>
          <LinkList items={FEELINGS} />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold">Grown-up pages</h2>
          <LinkList items={GROWN_UPS} />
        </section>

        <section className="mt-8 rounded-2xl px-4 py-4" style={{ background: '#EDE9FE' }}>
          <h2 className="text-lg font-extrabold">Good to know</h2>
          <ul className="mt-2 list-disc pl-5 text-base grid gap-1" style={{ color: '#4C1D95' }}>
            <li>Add <b>?age=3</b> to any link to play as a 3-year-old (that starts fresh), or <b>?buddy=sage</b> to pick a different friend.</li>
            <li>&ldquo;Tap to start&rdquo; shows once per browser session.</li>
            <li>Children never see scores, timers or a paywall. Results and plans are on grown-up pages only.</li>
            <li>Sound is on. Most lines are read aloud by Noel the panda.</li>
            <li>This is a test build. The real public site does not have these links.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
