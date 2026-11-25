import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { jumpLinksEnabled } from '@/lib/jumpGate';
import { planJump } from '@/lib/jump';
import JumpRunner from './JumpRunner';

// /go/<screen>: sets up a test child and opens that screen (preview builds
// only, see lib/jump.ts). Unknown screens and the real public site get the
// normal "not found" page.
export default async function Jump(props: {
  params: Promise<{ to: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  if (!jumpLinksEnabled()) notFound();
  const { to } = await props.params;
  const sp = await props.searchParams;
  const q: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) q[k] = Array.isArray(v) ? v[0] : v;
  const plan = planJump(to, q);
  if (!plan) notFound();
  return <JumpRunner plan={plan} />;
}
