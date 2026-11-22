import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { jumpLinksEnabled } from '@/lib/jumpGate';
import { JUMP_LINKS } from '@/lib/jump';

// /go: the list of every jump link (preview builds only, see lib/jump.ts).
// Each one makes a test child and opens straight on that screen.
export default async function JumpList() {
  await connection();
  if (!jumpLinksEnabled()) notFound();
  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#F5F3FF', color: '#2E1065' }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold">Jump links</h1>
        <p className="mt-2 text-base" style={{ color: '#4C1D95' }}>
          Preview only. Each link makes a test child called Robin on this device and opens straight on that screen.
          Add <b>?age=3</b> for a 3-year-old, <b>?buddy=sage</b> for a different friend, <b>?all=1</b> to unlock everything.
        </p>
        {JUMP_LINKS.map(g => (
          <section key={g.group} className="mt-6">
            <h2 className="text-lg font-extrabold">{g.group}</h2>
            <ul className="mt-2 grid gap-2">
              {g.items.map(i => (
                <li key={i.href}>
                  <Link href={i.href} prefetch={false}
                    className="flex justify-between items-center gap-3 rounded-2xl px-4 py-3 font-bold shadow-sm"
                    style={{ background: 'white', color: '#2E1065' }}>
                    <span className="capitalize">{i.label}</span>
                    <span className="text-sm font-mono" style={{ color: '#6D28D9' }}>{i.href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
